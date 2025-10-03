-- Migración para agregar tablas faltantes según requerimientos
-- Basado en Requerimientos.md y FlujoDetalladoSistema.md

-- Tabla: Asistencia
-- Para el checklist de asistencia del personal por turno
CREATE TABLE asistencia (
    id_asistencia SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    turno_id INTEGER NOT NULL REFERENCES turno(id_turno),
    sector_id INTEGER NOT NULL REFERENCES sector(id_sector),
    personal_id INTEGER NOT NULL REFERENCES personal(id_personal),
    estado_asistencia VARCHAR(50) NOT NULL, -- 'asistio_firmo', 'falta', 'descanso_semanal', 'feriado', 'permiso_medico'
    observaciones TEXT,
    supervisor_id INTEGER REFERENCES personal(id_personal), -- quien registra la asistencia
    parte_fisico_entregado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicados por día/turno/personal
    UNIQUE(fecha, turno_id, personal_id)
);

-- Tabla: Voucher
-- Para control financiero de ingresos y egresos
CREATE TABLE voucher (
    id_voucher SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- 'ingreso', 'egreso'
    concepto VARCHAR(200) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    responsable_id INTEGER NOT NULL REFERENCES personal(id_personal),
    movilidad_id INTEGER REFERENCES movilidad(id_movilidad), -- si es voucher de combustible
    numero_voucher VARCHAR(50),
    imagen_voucher_url TEXT, -- URL de la imagen del voucher (opcional)
    estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
    aprobado_por INTEGER REFERENCES personal(id_personal),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar campos faltantes a tablas existentes

-- Agregar campos a la tabla incidencia según requerimientos
ALTER TABLE incidencia 
ADD COLUMN estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'resuelto', 'derivado_pnp'
ADD COLUMN reportado_por VARCHAR(50), -- 'COE', 'Serenazgo a pie', 'Operador de móvil', 'Motorizado', 'Cámaras'
ADD COLUMN imagen_url TEXT, -- URL de imagen opcional
ADD COLUMN parte_fisico_entregado BOOLEAN DEFAULT FALSE;

-- Agregar campos a la tabla movilidad para control de combustible
ALTER TABLE movilidad 
ADD COLUMN combustible_cargado DECIMAL(8,2),
ADD COLUMN estado VARCHAR(20) DEFAULT 'activo'; -- 'activo', 'mantenimiento', 'inactivo'

-- Agregar campos a la tabla patrullaje
ALTER TABLE patrullaje 
ADD COLUMN observaciones TEXT,
ADD COLUMN imagen_url TEXT; -- URL de imagen del parte de patrullaje (opcional)

-- Agregar campos a la tabla bitacora_cabina
ALTER TABLE bitacora_cabina 
ADD COLUMN turno_id INTEGER REFERENCES turno(id_turno),
ADD COLUMN imagen_url TEXT; -- URL de imagen del cuaderno (opcional)

-- Índices para las nuevas tablas
CREATE INDEX idx_asistencia_fecha ON asistencia(fecha);
CREATE INDEX idx_asistencia_turno ON asistencia(turno_id);
CREATE INDEX idx_asistencia_sector ON asistencia(sector_id);
CREATE INDEX idx_asistencia_estado ON asistencia(estado_asistencia);

CREATE INDEX idx_voucher_fecha ON voucher(fecha);
CREATE INDEX idx_voucher_tipo ON voucher(tipo);
CREATE INDEX idx_voucher_estado ON voucher(estado);
CREATE INDEX idx_voucher_responsable ON voucher(responsable_id);

-- Triggers para las nuevas tablas
CREATE TRIGGER update_asistencia_updated_at BEFORE UPDATE ON asistencia FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voucher_updated_at BEFORE UPDATE ON voucher FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentar las tablas
COMMENT ON TABLE asistencia IS 'Registro de asistencia del personal por turno y sector';
COMMENT ON TABLE voucher IS 'Control financiero de ingresos y egresos, incluyendo vouchers de combustible';

COMMENT ON COLUMN asistencia.estado_asistencia IS 'Estados: asistio_firmo, falta, descanso_semanal, feriado, permiso_medico';
COMMENT ON COLUMN voucher.tipo IS 'Tipos: ingreso, egreso';
COMMENT ON COLUMN voucher.estado IS 'Estados: pendiente, aprobado, rechazado';