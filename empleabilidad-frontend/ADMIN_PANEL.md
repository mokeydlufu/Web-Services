# Panel de Administración - Vuexy Style

Este proyecto ahora incluye un panel de administración completo inspirado en el diseño de Vuexy.

## 🚀 Acceso al Panel Admin

Para acceder al panel de administración, navega a:

```
http://localhost:5173/admin/dashboard
```

O simplemente:

```
http://localhost:5173/admin
```

## 📋 Características del Panel

### Layout Principal
- **Sidebar izquierdo** con navegación completa
- **Header superior** con búsqueda, notificaciones y perfil de usuario
- **Diseño responsivo** adaptable a diferentes tamaños de pantalla

### Dashboard Analytics
El dashboard incluye los siguientes widgets:

1. **Website Analytics** (Grande - Izquierda)
   - Conversión total: 28.5%
   - Métricas de tráfico (Sessions, Page Views)
   - Leads y Conversiones
   - Diseño 3D con efecto de esfera glassmorphic

2. **Sales Overview** (Derecha Superior)
   - Indicador de crecimiento +18.2%
   - Total de ventas: $42.5k
   - Comparativa Order vs Visits
   - Gráfico de área de ingresos generados
   - Mini chart con gradiente verde

3. **Earning Reports** (Grande - Inferior Izquierda)
   - Reporte semanal de ganancias
   - Total: $468 con +4.2% de incremento
   - Gráfico de barras por día de la semana
   - Iconos de tecnologías (Vue, Nuxt, React, Next.js, HTML5, Laravel, .NET, Django)
   - Montos individuales por tecnología

4. **Support Tracker** (Derecha Inferior)
   - Últimos 7 días
   - Progreso circular: 85% de tareas completadas
   - Total de tickets: 164
   - Nuevos tickets con avatares (TypeScript, JavaScript, Figma)
   - Tiempo de respuesta: 1 día

## 🎨 Diseño y Estilo

- **Colores principales**: Violeta/Índigo (#6366f1, #4f46e5)
- **Tipografía**: Sistema font-stack optimizado
- **Iconos**: Lucide React
- **Gráficos**: SVG nativos con gradientes personalizados
- **Efectos**: Glassmorphism, gradientes, sombras suaves

## 🗺️ Rutas Disponibles

```typescript
/admin                    → Redirige a /admin/dashboard
/admin/dashboard          → Dashboard principal
/admin/analytics          → Análisis (usa el mismo dashboard por ahora)
/admin/crm                → CRM
/admin/ecommerce          → eCommerce
/admin/layouts            → Layouts
/admin/email              → Email
/admin/chat               → Chat
/admin/calendar           → Calendario
/admin/kanban             → Kanban
/admin/invoice            → Facturas
/admin/users              → Usuarios
/admin/roles              → Roles y Permisos
/admin/pages              → Páginas
/admin/auth               → Autenticación
```

## 🛠️ Tecnologías Utilizadas

- **React 19** + **Vite 8**
- **TypeScript 6**
- **Tailwind CSS 4**
- **React Router Dom 7**
- **Lucide React** (iconos)
- **Zustand** (estado global)

## 📝 Próximos Pasos

Para personalizar el dashboard:

1. **Conectar datos reales**: Reemplazar los datos estáticos con llamadas a API
2. **Agregar más vistas**: Implementar las demás rutas del menú lateral
3. **Interactividad**: Añadir filtros, exportación de datos, etc.
4. **Gráficos avanzados**: Integrar Chart.js o Recharts para gráficos más complejos
5. **Permisos**: Implementar control de acceso por roles

## 🔐 Autenticación

El panel está protegido por el sistema de autenticación existente. Asegúrate de estar logueado para acceder a las rutas `/admin/*`.

## 💡 Notas de Desarrollo

- El componente principal es `AdminLayout.tsx`
- El dashboard está en `AdminDashboardView.tsx`
- Todos los estilos usan Tailwind CSS v4
- Los colores del tema pueden ajustarse en el archivo de configuración de Tailwind
