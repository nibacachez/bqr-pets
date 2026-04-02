-- ============================================
-- SUPABASE SETUP: TRIGGER PARA EDGE FUNCTION
-- ============================================
-- 
-- Ejecuta este SQL en el SQL Editor de Supabase
-- para configurar el trigger automático que
-- llamará a la Edge Function notify-pet-found
-- 
-- Paso a paso:
-- 1. Ve a https://supabase.com/dashboard
-- 2. Abre el proyecto
-- 3. SQL Editor > New query
-- 4. Copia y ejecuta este SQL

-- ============================================
-- 1. HABILITAR EXTENSIONES REQUERIDAS
-- ============================================

-- Extensión para hacer HTTP calls desde funciones SQL
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA public;

-- Extensión para operaciones de red (alternativa más confiable)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA public;

-- ============================================
-- 2. TABLA DE LOGS (Para debugging)
-- ============================================

CREATE TABLE IF NOT EXISTS public.functions_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name TEXT NOT NULL,
    report_id UUID,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, success, error
    message TEXT,
    response_data JSONB,
    error_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_functions_logs_function_name ON public.functions_logs(function_name);
CREATE INDEX idx_functions_logs_report_id ON public.functions_logs(report_id);
CREATE INDEX idx_functions_logs_status ON public.functions_logs(status);
CREATE INDEX idx_functions_logs_created_at ON public.functions_logs(created_at DESC);

-- ============================================
-- 3. FUNCIÓN PL/PGSQL QUE LLAMA A EDGE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_pet_found()
RETURNS TRIGGER AS $$
DECLARE
    v_supabase_url TEXT;
    v_anon_key TEXT;
    v_edge_function_url TEXT;
    v_response_status INTEGER;
    v_response_content TEXT;
BEGIN
    -- Obtener configuración de Supabase
    -- Nota: En Supabase, estos valores están disponibles automáticamente
    v_supabase_url := current_setting('app.supabase_url', true) || 'https://your-project.supabase.co';
    v_anon_key := current_setting('app.anon_key', true);
    
    -- Construir URL de la Edge Function
    v_edge_function_url := v_supabase_url || '/functions/v1/notify-pet-found';

    -- Log: Función iniciada
    INSERT INTO public.functions_logs 
    (function_name, report_id, status, message)
    VALUES ('notify_pet_found', NEW.id, 'pending', 'Iniciando envío de notificación');

    -- Llamar a la Edge Function usando pg_net (más confiable)
    BEGIN
        PERFORM net.http_post(
            url := v_edge_function_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_anon_key,
                'User-Agent', 'BQR-PgNet/1.0'
            ),
            body := jsonb_build_object(
                'record', row_to_json(NEW)
            )
        );

        -- Log: Éxito
        INSERT INTO public.functions_logs 
        (function_name, report_id, status, message, response_data)
        VALUES (
            'notify_pet_found', 
            NEW.id, 
            'success', 
            'Notificación enviada exitosamente',
            jsonb_build_object('type', 'email_queued', 'timestamp', NOW())
        );

    EXCEPTION WHEN OTHERS THEN
        -- Log: Error
        INSERT INTO public.functions_logs 
        (function_name, report_id, status, message, error_details)
        VALUES (
            'notify_pet_found',
            NEW.id,
            'error',
            'Error al enviar notificación',
            SQLERRM || ' - ' || SQLSTATE
        );
        
        -- IMPORTANTE: No fallar la inserción del reporte
        -- Solo registramos el error para debugging
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. CREAR TRIGGER EN TABLA reportes_extravio
-- ============================================

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trigger_notify_pet_found ON public.reportes_extravio;

-- Crear nuevo trigger
-- Se ejecuta AFTER INSERT, para cada fila
-- Llamará a la función notify_pet_found()
CREATE TRIGGER trigger_notify_pet_found
AFTER INSERT ON public.reportes_extravio
FOR EACH ROW
EXECUTE FUNCTION public.notify_pet_found();

-- ============================================
-- 5. FUNCIÓN AUXILIAR: Ver últimos logs
-- ============================================

CREATE OR REPLACE FUNCTION public.get_function_logs(
    p_limit INT DEFAULT 10,
    p_function_name TEXT DEFAULT NULL
)
RETURNS TABLE (
    log_id UUID,
    function_name TEXT,
    report_id UUID,
    status TEXT,
    message TEXT,
    error_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        functions_logs.id,
        functions_logs.function_name,
        functions_logs.report_id,
        functions_logs.status,
        functions_logs.message,
        functions_logs.error_details,
        functions_logs.created_at
    FROM public.functions_logs
    WHERE (p_function_name IS NULL OR functions_logs.function_name = p_function_name)
    ORDER BY functions_logs.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Permisos
GRANT EXECUTE ON FUNCTION public.get_function_logs(INT, TEXT) TO authenticated;
GRANT SELECT ON public.functions_logs TO authenticated;

-- ============================================
-- 6. QUERY PARA TESTING
-- ============================================

-- Ver últimos logs:
-- SELECT * FROM public.get_function_logs(20);

-- Insertar reporte de prueba:
-- INSERT INTO reportes_extravio (
--     mascota_id,
--     nombre_rescatador,
--     contacto_rescatador,
--     tipo_contacto,
--     mensaje_ubicacion,
--     latitud,
--     longitud,
--     estado
-- ) VALUES (
--     '550e8400-e29b-41d4-a716-446655440000',
--     'Test User',
--     'test@example.com',
--     'email',
--     'Encontrado en el parque central',
--     40.7128,
--     -74.0060,
--     'nuevo'
-- );

-- Verificar que el trigger está creado:
-- SELECT trigger_name, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_name = 'trigger_notify_pet_found';

-- ============================================
-- 7. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

COMMENT ON FUNCTION public.notify_pet_found() IS 'Función que se ejecuta cuando se inserta un nuevo reporte en reportes_extravio. Llama a la Edge Function notify-pet-found para enviar email al dueño.';

COMMENT ON TRIGGER trigger_notify_pet_found ON public.reportes_extravio IS 'Trigger que ejecuta notify_pet_found() después de cada INSERT en reportes_extravio.';

COMMENT ON TABLE public.functions_logs IS 'Tabla de logs para debugging de Edge Functions y triggers. Registra cada llamada a notify_pet_found().';
