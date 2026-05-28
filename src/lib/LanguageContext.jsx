import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k });

export const translations = {
  en: {
    // Nav
    nav_home: 'Home',
    nav_book: 'Book',
    nav_jobs: 'My Jobs',
    nav_quotes: 'Quotes',
    nav_invoices: 'Invoices',
    nav_account: 'Account',

    // Home
    welcome_back: 'Welcome back,',
    upcoming_jobs: '{n} upcoming job{s} scheduled',
    request_service: 'Request a Service',
    book_a_date: 'Book a date',
    upcoming: 'Upcoming',
    past_jobs: 'Past Jobs',
    pending_quotes_alert: 'You have {n} quote{s} waiting for your response!',
    pending_quotes_sub: 'A provider has submitted a price — review and accept to book your service.',
    review: 'Review',
    view_all_jobs: 'View all jobs →',

    // Book
    book_service: 'Book a Service',
    book_service_sub: 'Choose a service and pick your preferred date & time.',
    from_price: 'From ${price}',
    book_now: 'Book now →',

    // Jobs
    no_jobs: 'No jobs yet',
    no_jobs_sub: 'Request a service from the Home tab to get started.',

    // Quotes tab
    my_quotes: 'My Quotes',
    my_quotes_sub: 'View provider quotes on your service requests.',
    no_active_requests: 'No active requests',
    no_active_requests_sub: 'Request a service from the Home tab to get started.',
    waiting_for_quotes: 'Waiting for quotes',
    quote_received: 'Quote received!',
    accepted: 'Accepted',
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    date_label: 'Date:',
    provider_quotes: 'Provider Quotes',
    no_quotes_yet: 'No quotes yet — providers will respond shortly.',

    // Quote card
    accept_pay: 'Accept & Pay',
    accept_add_card: 'Accept & Add Card',
    decline: 'Decline',
    authorizing: 'Authorizing...',
    card_note: 'Card authorized now, charged only after job completion',
    quote_accepted: 'Quote accepted! Card authorized for ${price}.',
    payment_failed: 'Payment authorization failed.',
    quote_declined: 'Quote declined.',

    // Request job modal
    request_quote: 'Request a Quote',
    service_address: 'Service Address',
    zip_code: 'ZIP Code',
    preferred_date: 'Preferred Date',
    how_often: 'How often do you need this?',
    one_time: 'One Time',
    weekly: 'Weekly',
    biweekly: 'Bi-Weekly',
    recurrence_note_weekly: "We'll automatically post your next 4 weekly cuts so providers can plan ahead.",
    recurrence_note_biweekly: "We'll automatically post your next 4 bi-weekly cuts so providers can plan ahead.",
    notes_for_provider: 'Notes for Provider (optional)',
    notes_placeholder: 'Any special instructions, gate codes, pets, etc.',
    quote_disclaimer: '<strong>Please note:</strong> This quote is not a guaranteed price. It allows lawn care professionals in your area to review your request and respond with their availability and final pricing.',
    cancel: 'Cancel',
    submit_request: 'Submit Request',

    // Job card
    provider_label: 'Provider:',
    respond: 'Respond →',
    request_weather_reschedule: 'Request Weather Reschedule',
    leave_review: 'Leave a Review',
    review_submitted: '✓ Review submitted',

    // Profile editor
    complete_profile: 'Complete your profile to make booking faster.',
    add_info: 'Add your info →',
    phone: 'Phone',
    full_name: 'Full Name',
    edit: 'Edit',
    save_changes: 'Save Changes',
    saving: 'Saving...',
    email_notifications: 'Email Notifications',
    notif_sub: 'Choose what emails you want to receive.',
    notif_new_quote: 'New Quote Received',
    notif_new_quote_desc: 'When a provider sends you a quote',
    notif_job_accepted: 'Job Accepted',
    notif_job_accepted_desc: 'When a provider accepts your booking',
    notif_job_completed: 'Job Completed',
    notif_job_completed_desc: 'When your job is marked as done',
    notif_promotions: 'Promotions & News',
    notif_promotions_desc: 'Special offers and platform updates',
    save_prefs_note: 'Save your contact info above to also save notification preferences.',
    save_preferences: 'Save Preferences',
    account: 'Account',
    sign_out: 'Sign Out',
    close_account: 'Close My Account',
    close_account_warning: '⚠️ This will permanently delete your profile and all associated data. This cannot be undone.',
    yes_close_account: 'Yes, Close Account',
    closing: 'Closing...',
    profile_updated: 'Profile updated successfully.',
    profile_update_failed: 'Failed to save profile.',
    prefs_saved: 'Notification preferences saved.',
    prefs_failed: 'Failed to save preferences.',
    account_closed: 'Account closed. Signing out...',
    account_close_failed: 'Failed to close account. Please contact support.',

    // Job request success
    job_submitted_onetime: 'Quote request submitted! Providers in your area will respond shortly.',
    job_submitted_weekly: 'Weekly cuts scheduled! 5 jobs posted for providers in your area.',
    job_submitted_biweekly: 'Bi-weekly cuts scheduled! 5 jobs posted for providers in your area.',

    // Language toggle
    language: 'Language',
    english: 'English',
    spanish: 'Español',

    // Invoices
    invoices: 'Invoices',
    invoices_sub: 'Review and pay your invoices from GrassGodz.',

    // Account tab
    my_account: 'Account',

    // Checklist
    checklist_address: 'Add your service address',
    checklist_phone: 'Confirm your phone number',
    checklist_zip: 'Add your ZIP code',
    checklist_first_service: 'Request your first service',
    complete_your_profile: 'Complete your profile',
    expires_label: 'Expires',

    // Status badges
    status_requested: 'Requested',
    status_quoted: 'Quoted',
    status_accepted: 'Accepted',
    status_scheduled: 'Scheduled',
    status_in_progress: 'In Progress',
    status_completed: 'Completed',
    status_cancelled: 'Cancelled',
  },

  es: {
    // Nav
    nav_home: 'Inicio',
    nav_book: 'Reservar',
    nav_jobs: 'Mis Trabajos',
    nav_quotes: 'Cotizaciones',
    nav_invoices: 'Facturas',
    nav_account: 'Cuenta',

    // Home
    welcome_back: 'Bienvenido,',
    upcoming_jobs: '{n} trabajo{s} próximo{s}',
    request_service: 'Solicitar un Servicio',
    book_a_date: 'Reservar fecha',
    upcoming: 'Próximos',
    past_jobs: 'Trabajos Pasados',
    pending_quotes_alert: '¡Tienes {n} cotización{s} esperando tu respuesta!',
    pending_quotes_sub: 'Un proveedor ha enviado un precio — revisa y acepta para confirmar tu servicio.',
    review: 'Revisar',
    view_all_jobs: 'Ver todos los trabajos →',

    // Book
    book_service: 'Reservar un Servicio',
    book_service_sub: 'Elige un servicio y selecciona tu fecha y hora preferida.',
    from_price: 'Desde ${price}',
    book_now: 'Reservar ahora →',

    // Jobs
    no_jobs: 'Sin trabajos aún',
    no_jobs_sub: 'Solicita un servicio desde la pestaña Inicio para comenzar.',

    // Quotes tab
    my_quotes: 'Mis Cotizaciones',
    my_quotes_sub: 'Ver cotizaciones de proveedores para tus solicitudes.',
    no_active_requests: 'Sin solicitudes activas',
    no_active_requests_sub: 'Solicita un servicio desde la pestaña Inicio para comenzar.',
    waiting_for_quotes: 'Esperando cotizaciones',
    quote_received: '¡Cotización recibida!',
    accepted: 'Aceptado',
    scheduled: 'Programado',
    in_progress: 'En Progreso',
    date_label: 'Fecha:',
    provider_quotes: 'Cotizaciones del Proveedor',
    no_quotes_yet: 'Sin cotizaciones aún — los proveedores responderán pronto.',

    // Quote card
    accept_pay: 'Aceptar y Pagar',
    accept_add_card: 'Aceptar y Agregar Tarjeta',
    decline: 'Rechazar',
    authorizing: 'Autorizando...',
    card_note: 'Tarjeta autorizada ahora, cobrada solo después de completar el trabajo',
    quote_accepted: 'Cotización aceptada. Tarjeta autorizada por ${price}.',
    payment_failed: 'Fallo en la autorización de pago.',
    quote_declined: 'Cotización rechazada.',

    // Request job modal
    request_quote: 'Solicitar Cotización',
    service_address: 'Dirección del Servicio',
    zip_code: 'Código Postal',
    preferred_date: 'Fecha Preferida',
    how_often: '¿Con qué frecuencia necesitas esto?',
    one_time: 'Una Vez',
    weekly: 'Semanal',
    biweekly: 'Cada Dos Semanas',
    recurrence_note_weekly: 'Publicaremos automáticamente tus próximos 4 cortes semanales para que los proveedores puedan planificar.',
    recurrence_note_biweekly: 'Publicaremos automáticamente tus próximos 4 cortes quincenales para que los proveedores puedan planificar.',
    notes_for_provider: 'Notas para el Proveedor (opcional)',
    notes_placeholder: 'Instrucciones especiales, códigos de puerta, mascotas, etc.',
    quote_disclaimer: '<strong>Nota:</strong> Esta cotización no es un precio garantizado. Permite que los profesionales de cuidado de jardines en tu área revisen tu solicitud y respondan con su disponibilidad y precio final.',
    cancel: 'Cancelar',
    submit_request: 'Enviar Solicitud',

    // Job card
    provider_label: 'Proveedor:',
    respond: 'Responder →',
    request_weather_reschedule: 'Solicitar Reprogramación por Clima',
    leave_review: 'Dejar una Reseña',
    review_submitted: '✓ Reseña enviada',

    // Profile editor
    complete_profile: 'Completa tu perfil para reservas más rápidas.',
    add_info: 'Agregar información →',
    phone: 'Teléfono',
    full_name: 'Nombre Completo',
    edit: 'Editar',
    save_changes: 'Guardar Cambios',
    saving: 'Guardando...',
    email_notifications: 'Notificaciones por Correo',
    notif_sub: 'Elige qué correos deseas recibir.',
    notif_new_quote: 'Nueva Cotización Recibida',
    notif_new_quote_desc: 'Cuando un proveedor te envía una cotización',
    notif_job_accepted: 'Trabajo Aceptado',
    notif_job_accepted_desc: 'Cuando un proveedor acepta tu reserva',
    notif_job_completed: 'Trabajo Completado',
    notif_job_completed_desc: 'Cuando tu trabajo está marcado como terminado',
    notif_promotions: 'Promociones y Noticias',
    notif_promotions_desc: 'Ofertas especiales y actualizaciones de la plataforma',
    save_prefs_note: 'Guarda tu información de contacto arriba para guardar también las preferencias de notificación.',
    save_preferences: 'Guardar Preferencias',
    account: 'Cuenta',
    sign_out: 'Cerrar Sesión',
    close_account: 'Cerrar Mi Cuenta',
    close_account_warning: '⚠️ Esto eliminará permanentemente tu perfil y todos los datos asociados. Esta acción no se puede deshacer.',
    yes_close_account: 'Sí, Cerrar Cuenta',
    closing: 'Cerrando...',
    profile_updated: 'Perfil actualizado exitosamente.',
    profile_update_failed: 'Error al guardar el perfil.',
    prefs_saved: 'Preferencias de notificación guardadas.',
    prefs_failed: 'Error al guardar preferencias.',
    account_closed: 'Cuenta cerrada. Cerrando sesión...',
    account_close_failed: 'Error al cerrar cuenta. Por favor contacta soporte.',

    // Job request success
    job_submitted_onetime: '¡Solicitud de cotización enviada! Los proveedores en tu área responderán pronto.',
    job_submitted_weekly: '¡Cortes semanales programados! 5 trabajos publicados para proveedores en tu área.',
    job_submitted_biweekly: '¡Cortes quincenales programados! 5 trabajos publicados para proveedores en tu área.',

    // Language toggle
    language: 'Idioma',
    english: 'English',
    spanish: 'Español',

    // Invoices
    invoices: 'Facturas',
    invoices_sub: 'Revisa y paga tus facturas de GrassGodz.',

    // Account tab
    my_account: 'Cuenta',

    // Checklist
    checklist_address: 'Agrega tu dirección de servicio',
    checklist_phone: 'Confirma tu número de teléfono',
    checklist_zip: 'Agrega tu código postal',
    checklist_first_service: 'Solicita tu primer servicio',
    complete_your_profile: 'Completa tu perfil',
    expires_label: 'Vence',

    // Status badges
    status_requested: 'Solicitado',
    status_quoted: 'Cotizado',
    status_accepted: 'Aceptado',
    status_scheduled: 'Programado',
    status_in_progress: 'En Progreso',
    status_completed: 'Completado',
    status_cancelled: 'Cancelado',
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    // Detect browser language as initial default
    const browserLang = navigator.language?.startsWith('es') ? 'es' : 'en';
    const stored = localStorage.getItem('gg_lang');
    if (stored === 'en' || stored === 'es') {
      setLangState(stored);
    } else {
      setLangState(browserLang);
    }
  }, []);

  const setLang = async (newLang) => {
    setLangState(newLang);
    localStorage.setItem('gg_lang', newLang);
    // Persist to user profile if logged in
    try {
      const user = await base44.auth.me();
      if (user) {
        const profiles = await base44.entities.CustomerProfile.filter({ user_email: user.email });
        if (profiles[0]?.id) {
          await base44.entities.CustomerProfile.update(profiles[0].id, { language: newLang });
        }
      }
    } catch {
      // Silently fail — localStorage is enough
    }
  };

  const t = (key, vars = {}) => {
    let str = translations[lang]?.[key] || translations['en']?.[key] || key;
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, v);
    });
    return str;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}