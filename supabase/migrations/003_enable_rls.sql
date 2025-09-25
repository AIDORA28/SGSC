-- Habilitar Row Level Security (RLS) y configurar políticas de seguridad

-- Habilitar RLS en todas las tablas
ALTER TABLE turno ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE anexo ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabina ENABLE ROW LEVEL SECURITY;
ALTER TABLE movilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrullaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE bitacora_cabina ENABLE ROW LEVEL SECURITY;

-- Políticas para tabla turno (lectura para todos los usuarios autenticados)
CREATE POLICY "Usuarios autenticados pueden leer turnos" ON turno
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Solo administradores pueden modificar turnos" ON turno
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para tabla sector
CREATE POLICY "Usuarios autenticados pueden leer sectores" ON sector
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Solo administradores pueden modificar sectores" ON sector
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para tabla personal
CREATE POLICY "Usuarios pueden leer personal" ON personal
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Solo administradores y supervisores pueden modificar personal" ON personal
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'supervisor')
    );

-- Políticas para tabla anexo
CREATE POLICY "Usuarios autenticados pueden leer anexos" ON anexo
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Solo administradores pueden modificar anexos" ON anexo
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para tabla cabina
CREATE POLICY "Usuarios autenticados pueden leer cabinas" ON cabina
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Solo administradores pueden modificar cabinas" ON cabina
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para tabla movilidad
CREATE POLICY "Usuarios autenticados pueden leer movilidad" ON movilidad
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Choferes pueden actualizar su movilidad asignada" ON movilidad
    FOR UPDATE USING (
        chofer_asignado IN (
            SELECT id_personal FROM personal 
            WHERE dni = auth.jwt() ->> 'dni'
        )
    );

CREATE POLICY "Solo administradores pueden crear/eliminar movilidad" ON movilidad
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Políticas para tabla patrullaje
CREATE POLICY "Usuarios pueden leer patrullajes" ON patrullaje
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Personal puede crear sus propios patrullajes" ON patrullaje
    FOR INSERT WITH CHECK (
        personal_id IN (
            SELECT id_personal FROM personal 
            WHERE dni = auth.jwt() ->> 'dni'
        )
    );

CREATE POLICY "Personal puede actualizar sus propios patrullajes" ON patrullaje
    FOR UPDATE USING (
        personal_id IN (
            SELECT id_personal FROM personal 
            WHERE dni = auth.jwt() ->> 'dni'
        )
    );

-- Políticas para tabla supervisor
CREATE POLICY "Usuarios autenticados pueden leer supervisores" ON supervisor
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Solo administradores pueden modificar supervisores" ON supervisor
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para tabla incidencia
CREATE POLICY "Usuarios pueden leer incidencias" ON incidencia
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Personal puede crear incidencias" ON incidencia
    FOR INSERT WITH CHECK (
        personal_reporta IN (
            SELECT id_personal FROM personal 
            WHERE dni = auth.jwt() ->> 'dni'
        )
    );

CREATE POLICY "Personal puede actualizar sus propias incidencias" ON incidencia
    FOR UPDATE USING (
        personal_reporta IN (
            SELECT id_personal FROM personal 
            WHERE dni = auth.jwt() ->> 'dni'
        )
    );

-- Políticas para tabla bitacora_cabina
CREATE POLICY "Usuarios pueden leer bitácora de cabina" ON bitacora_cabina
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Personal puede crear entradas en bitácora" ON bitacora_cabina
    FOR INSERT WITH CHECK (
        personal_id IN (
            SELECT id_personal FROM personal 
            WHERE dni = auth.jwt() ->> 'dni'
        )
    );

CREATE POLICY "Personal puede actualizar sus propias entradas de bitácora" ON bitacora_cabina
    FOR UPDATE USING (
        personal_id IN (
            SELECT id_personal FROM personal 
            WHERE dni = auth.jwt() ->> 'dni'
        )
    );

-- Crear función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(auth.jwt() ->> 'role', 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para verificar si el usuario es administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;