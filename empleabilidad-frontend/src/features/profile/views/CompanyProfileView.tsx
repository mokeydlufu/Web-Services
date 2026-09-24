import React, { useState } from 'react';
import { 
  MapPin, Globe, Mail, Phone, ShieldCheck, 
  Sparkles, Camera, Save, CheckCircle2, Edit3, Briefcase, 
  Users, ExternalLink, Lock, Eye, EyeOff
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { Button } from '@/shared/components/Button';
import { alerts } from '@/shared/utils/alerts';
import { profileService } from '../services/profile.service';
import { useEffect, useRef } from 'react';

interface EmpresaProfileData {
  razonSocial: string;
  nombreComercial: string;
  ruc: string;
  email: string;
  emailCorporativo: string;
  telefono: string;
  sitioWeb: string;
  industria: string;
  tamano: string;
  ubicacion: string;
  direccion: string;
  descripcion: string;
  logo: string;
  bannerColor: string;
  estadoVerificacion: 'VERIFICADA' | 'PENDIENTE' | 'EN_REVISION' | 'RECHAZADA' | 'SUSPENDIDA';
  motivoRechazo?: string;
  beneficios: string[];
  redes: {
    linkedin: string;
    twitter: string;
    github: string;
  };
}

const BENEFICIOS_DISPONIBLES = [
  'Trabajo Remoto / Híbrido',
  'Seguro Médico EPS',
  'Horario Flexible',
  'Bono por Desempeño',
  'Capacitaciones y Certificaciones',
  'Línea de Carrera',
  'Descuentos Corporativos',
  'Equipos de Trabajo (MacBook / Laptop)',
  'Días libres por cumpleaños',
  'Ambiente Pet Friendly'
];

export const CompanyProfileView: React.FC = () => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'CONTACTO' | 'CULTURA' | 'SEGURIDAD'>('GENERAL');
  
  // Contraseñas
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Perfil editable de la empresa
  const [profile, setProfile] = useState<EmpresaProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await profileService.getMiPerfilEmpresa();
        
        // Mapear de backend a la interfaz del frontend
        setProfile({
          razonSocial: data.razonSocial || '',
          nombreComercial: data.nombreComercial || '',
          ruc: data.ruc || '',
          email: data.email || '',
          emailCorporativo: data.emailCorporativo || '',
          telefono: data.telefono || '',
          sitioWeb: data.sitioWeb || '',
          industria: data.industria || '',
          tamano: data.tamano || '',
          ubicacion: data.ubicacion || '',
          direccion: data.direccion || '',
          descripcion: data.descripcion || '',
          logo: data.logo || '',
          bannerColor: 'from-blue-600 via-indigo-700 to-slate-900',
          estadoVerificacion: data.estadoVerificacion || 'PENDIENTE',
          motivoRechazo: data.motivoRechazo,
          beneficios: data.beneficios || [],
          redes: {
            linkedin: data.linkedinUrl || '',
            twitter: data.twitterUrl || '',
            github: data.githubUrl || ''
          }
        });
      } catch (error) {
        console.error('Error fetching company profile:', error);
        await alerts.error('Error', 'No se pudo cargar el perfil de la empresa.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // Guardar cambios
  const handleSaveChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile) return;
    try {
      const payload = {
        nombreComercial: profile.nombreComercial,
        emailCorporativo: profile.emailCorporativo,
        telefono: profile.telefono,
        sitioWeb: profile.sitioWeb,
        industria: profile.industria,
        tamano: profile.tamano,
        ubicacion: profile.ubicacion,
        direccion: profile.direccion,
        descripcion: profile.descripcion,
        beneficios: profile.beneficios,
        linkedinUrl: profile.redes.linkedin,
        twitterUrl: profile.redes.twitter,
        githubUrl: profile.redes.github
      };
      await profileService.updatePerfilEmpresa(payload);
      setIsEditing(false);
      alerts.success('Perfil actualizado', 'Los cambios se guardaron correctamente.');
    } catch (error) {
      console.error(error);
      alerts.error('Error', 'Hubo un error al guardar los cambios.');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await profileService.uploadLogoEmpresa(file);
      const data = await profileService.getMiPerfilEmpresa();
      setProfile(prev => prev ? { ...prev, logo: data.logo || '' } : null);
      await alerts.success('Logo actualizado', 'El logo se ha cambiado con éxito.');
    } catch (error) {
      console.error(error);
      await alerts.error('Error', 'Error al subir el logo.');
    }
  };

  // Toggle beneficio
  const handleToggleBeneficio = (beneficio: string) => {
    if (!isEditing || !profile) return;
    setProfile(prev => {
      if (!prev) return prev;
      const exists = prev.beneficios.includes(beneficio);
      return {
        ...prev,
        beneficios: exists 
          ? prev.beneficios.filter(b => b !== beneficio)
          : [...prev.beneficios, beneficio]
      };
    });
  };

  // Cambiar contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass || !confirmPass) {
      alerts.warning('Campos incompletos', 'Por favor completa todos los campos de contraseña.');
      return;
    }
    if (newPass !== confirmPass) {
      alerts.warning('No coinciden', 'La nueva contraseña y su confirmación no coinciden.');
      return;
    }
    if (newPass.length < 6) {
      alerts.warning('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (currentPass === newPass) {
      alerts.warning('Contraseña idéntica', 'La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    try {
      await profileService.updatePasswordEmpresa({
        contrasenaActual: currentPass,
        contrasenaNueva: newPass
      });
      await alerts.success('Contraseña actualizada', 'Tu contraseña fue cambiada correctamente.');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.mensaje || 'Error al actualizar la contraseña.';
      await alerts.error('Error', errorMessage);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const fieldsToCheck = [
    profile.nombreComercial,
    profile.descripcion,
    profile.logo,
    profile.sitioWeb,
    profile.industria,
    profile.tamano,
    profile.ubicacion,
    profile.direccion,
    profile.emailCorporativo
  ];
  const completedFields = fieldsToCheck.filter(field => field && field.trim() !== '').length;
  const completitud = Math.round((completedFields / fieldsToCheck.length) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleLogoUpload} />
      {/* 1. Header Banner & Perfil Principal */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
        {/* Banner Superior */}
        <div className={`h-48 sm:h-56 bg-gradient-to-r ${profile.bannerColor} relative p-6 flex flex-col justify-between overflow-hidden`}>
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex justify-between items-start z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              RUC Verificado por SUNAT
            </span>

            {/* Botón Modo Edición */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => handleSaveChanges()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  Guardar Cambios
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white/90 hover:bg-white text-slate-800 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 backdrop-blur-sm"
                >
                  <Edit3 className="h-4 w-4 text-blue-600" />
                  Editar Información
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sección de Avatar e Identidad */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
            {/* Logo / Avatar */}
            <div className="relative group">
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl bg-white p-2 shadow-xl border-4 border-white flex items-center justify-center overflow-hidden">
                <div className="h-full w-full rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-4xl flex items-center justify-center shadow-inner overflow-hidden">
                  {profile.logo ? (
                    <img src={profile.logo} alt="Logo" className="w-full h-full object-cover bg-white" />
                  ) : (
                    (profile.nombreComercial || profile.razonSocial).substring(0, 2).toUpperCase()
                  )}
                </div>
              </div>
              {isEditing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2 bg-slate-900 text-white rounded-xl shadow-md hover:bg-blue-600 transition-colors"
                  title="Cambiar Logo"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Estadísticas Rápidas */}
            <div className="flex items-center gap-3 sm:gap-6 text-slate-600">
              <div className="text-center px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-lg font-black text-slate-900">Activo</p>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estado Cuenta</p>
              </div>
              <div className="text-center px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className={`text-lg font-black ${completitud === 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {completitud}%
                </p>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completitud</p>
              </div>
            </div>
            
            <div className="mt-3 text-right sm:text-left w-full sm:w-auto">
              {completitud === 100 ? (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Perfil completo</span>
              ) : (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">Completa tu perfil para mejorar la visibilidad de tu empresa.</span>
              )}
            </div>
          </div>

          {/* Datos Principales */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {profile.nombreComercial || profile.razonSocial}
              </h1>
              {profile.estadoVerificacion === 'VERIFICADA' ? (
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Verificada
                </span>
              ) : profile.estadoVerificacion === 'RECHAZADA' ? (
                <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full inline-flex items-center gap-1">
                  Rechazada
                </span>
              ) : profile.estadoVerificacion === 'SUSPENDIDA' ? (
                <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full inline-flex items-center gap-1">
                  Suspendida
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full inline-flex items-center gap-1">
                  En Revisión
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-500 mb-3">
              {profile.razonSocial} &bull; RUC: <strong className="text-slate-700">{profile.ruc}</strong>
            </p>

            {/* Metadatos en Línea */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-600 font-medium">
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <Briefcase className="h-4 w-4 text-blue-600" />
                {profile.industria || 'No especificado'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <Users className="h-4 w-4 text-blue-600" />
                {profile.tamano || 'No especificado'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <MapPin className="h-4 w-4 text-rose-500" />
                {profile.ubicacion || 'No especificado'}
              </span>
              {profile.sitioWeb && (
                <a 
                  href={profile.sitioWeb} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
                >
                  <Globe className="h-4 w-4 text-blue-600" />
                  {profile.sitioWeb.replace('https://', '')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {profile.estadoVerificacion === 'RECHAZADA' && profile.motivoRechazo && (
              <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-1">
                  Tu empresa fue rechazada.
                </h3>
                <p className="text-sm">
                  <span className="font-semibold">Motivo:</span> {profile.motivoRechazo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Barra de Pestañas */}
        <div className="px-6 sm:px-8 border-t border-slate-100 flex gap-6 overflow-x-auto text-sm font-semibold">
          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`py-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'GENERAL'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Información General
          </button>
          <button
            onClick={() => setActiveTab('CONTACTO')}
            className={`py-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'CONTACTO'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Contacto y Ubicación
          </button>
          <button
            onClick={() => setActiveTab('CULTURA')}
            className={`py-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'CULTURA'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Cultura & Beneficios
          </button>
          <button
            onClick={() => setActiveTab('SEGURIDAD')}
            className={`py-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'SEGURIDAD'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Seguridad & Cuenta
          </button>
        </div>
      </div>

      {/* 2. Contenido según Pestaña Activa */}
      {/* PESTAÑA 1: INFORMACIÓN GENERAL */}
      {activeTab === 'GENERAL' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Datos Corporativos</h2>
              <p className="text-xs text-slate-500">Información visible para los candidatos en las ofertas laborales.</p>
            </div>
            {isEditing && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 animate-pulse">
                Modo Edición Habilitado
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Razón Social
              </label>
              <input
                type="text"
                disabled={true}
                value={profile.razonSocial}
                className="w-full px-4 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">La Razón Social está verificada con SUNAT y no es modificable.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nombre Comercial
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={profile.nombreComercial}
                onChange={(e) => setProfile({ ...profile, nombreComercial: e.target.value })}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                RUC (Registro Único de Contribuyentes)
              </label>
              <input
                type="text"
                disabled={true}
                value={profile.ruc}
                className="w-full px-4 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">El RUC está verificado con SUNAT y no es modificable.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Industria / Rubro
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={profile.industria}
                onChange={(e) => setProfile({ ...profile, industria: e.target.value })}
                placeholder="Ej: FinTech, Software, Minería, Retail"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Tamaño de Empresa
              </label>
              <select
                disabled={!isEditing}
                value={profile.tamano}
                onChange={(e) => setProfile({ ...profile, tamano: e.target.value })}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600"
              >
                <option value="">No especificado</option>
                <option value="1-10 empleados">1-10 empleados (Microempresa)</option>
                <option value="11-50 empleados">11-50 empleados (Pequeña)</option>
                <option value="51-200 empleados">51-200 empleados (Mediana)</option>
                <option value="201-500 empleados">201-500 empleados (Grande)</option>
                <option value="Más de 500 empleados">Más de 500 empleados (Corporativo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Sitio Web Oficial
              </label>
              <input
                type="url"
                disabled={!isEditing}
                value={profile.sitioWeb}
                onChange={(e) => setProfile({ ...profile, sitioWeb: e.target.value })}
                placeholder="https://tuempresa.com"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Acerca de la Empresa (Descripción)
              </label>
              <textarea
                rows={4}
                disabled={!isEditing}
                value={profile.descripcion}
                onChange={(e) => setProfile({ ...profile, descripcion: e.target.value })}
                placeholder="Describe la misión, cultura y actividades principales de tu empresa..."
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <button
                type="button"
                onClick={() => handleSaveChanges()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar Información
              </button>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: CONTACTO Y UBICACIÓN */}
      {activeTab === 'CONTACTO' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Información de Contacto y Oficinas</h2>
              <p className="text-xs text-slate-500">Canales de comunicación oficiales y sede de trabajo.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Correo Electrónico de Contacto
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  disabled={!isEditing}
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email de Reclutamiento / Talento
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  disabled={!isEditing}
                  value={profile.emailCorporativo}
                  onChange={(e) => setProfile({ ...profile, emailCorporativo: e.target.value })}
                  placeholder="talento@tuempresa.pe"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Teléfono de Oficina / WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={profile.telefono}
                  onChange={(e) => setProfile({ ...profile, telefono: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Ciudad / País
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.ubicacion}
                  onChange={(e) => setProfile({ ...profile, ubicacion: e.target.value })}
                  placeholder="Lima, Perú"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Dirección Física
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={profile.direccion}
                onChange={(e) => setProfile({ ...profile, direccion: e.target.value })}
                placeholder="Av. Principal 123, Oficina 401..."
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* Redes Sociales Corporativas */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Presencia en Línea & Redes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">LinkedIn</label>
                <input
                  type="url"
                  disabled={!isEditing}
                  value={profile.redes.linkedin}
                  onChange={(e) => setProfile({ ...profile, redes: { ...profile.redes, linkedin: e.target.value } })}
                  placeholder="https://linkedin.com/company/..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">Twitter / X</label>
                <input
                  type="url"
                  disabled={!isEditing}
                  value={profile.redes.twitter}
                  onChange={(e) => setProfile({ ...profile, redes: { ...profile.redes, twitter: e.target.value } })}
                  placeholder="https://twitter.com/..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 font-medium mb-1">GitHub / Tech</label>
                <input
                  type="url"
                  disabled={!isEditing}
                  value={profile.redes.github}
                  onChange={(e) => setProfile({ ...profile, redes: { ...profile.redes, github: e.target.value } })}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <button
                type="button"
                onClick={() => handleSaveChanges()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar Información
              </button>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 3: CULTURA Y BENEFICIOS */}
      {activeTab === 'CULTURA' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cultura Organizacional & Beneficios</h2>
              <p className="text-xs text-slate-500">Destaca las ventajas competitivas de pertenecer a tu equipo.</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Beneficios Ofrecidos a los Colaboradores</h3>
            <p className="text-xs text-slate-500 mb-4">
              {isEditing 
                ? 'Haz clic en los beneficios para activarlos o desactivarlos del perfil de tu empresa:' 
                : 'Beneficios activos que se exhiben a los postulantes:'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BENEFICIOS_DISPONIBLES.map((beneficio) => {
                const isSelected = profile.beneficios.includes(beneficio);
                return (
                  <button
                    key={beneficio}
                    type="button"
                    disabled={!isEditing}
                    onClick={() => handleToggleBeneficio(beneficio)}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected 
                        ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-semibold shadow-xs' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
                    } ${isEditing ? 'cursor-pointer hover:border-blue-400 hover:opacity-100' : 'cursor-default'}`}
                  >
                    <span className="text-xs sm:text-sm">{beneficio}</span>
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-transparent'
                    }`}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 flex items-start gap-3 mt-6">
            <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">Atrae al mejor talento</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Las empresas con más de 4 beneficios declarados reciben hasta un 45% más de postulaciones de candidatos altamente calificados en la plataforma.
              </p>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <button
                type="button"
                onClick={() => handleSaveChanges()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar Beneficios
              </button>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 4: SEGURIDAD Y CUENTA */}
      {activeTab === 'SEGURIDAD' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Seguridad & Credenciales</h2>
              <p className="text-xs text-slate-500">Administra la contraseña y el acceso seguro a tu cuenta de empresa.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Estado de Seguridad */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Lock className="h-4 w-4 text-blue-600" />
                Nivel de Seguridad
              </div>
              <p className="text-xs text-slate-500">
                Tu cuenta corporativa está protegida con autenticación JWT y verificación de identidad SUNAT.
              </p>
              <div className="pt-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                  Protegida & Confiable
                </span>
              </div>
            </div>

            {/* Formulario de Cambio de Contraseña */}
            <div className="md:col-span-2 space-y-4">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow transition-colors"
                  >
                    Actualizar Contraseña
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
