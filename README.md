# 🚌 Recorridos App

Sistema de gestión para transporte escolar y recorridos, diseñado para administrar rutas, vehículos, estudiantes y asistencia mediante códigos QR.

## 📋 Descripción

Este proyecto es una aplicación web progresiva (PWA) desarrollada con **React** y **Vite**, optimizada para dispositivos móviles y escritorio. Permite a los administradores y conductores gestionar eficientemente los recorridos escolares, llevar un control de los niños transportados y registrar su asistencia en tiempo real utilizando un escáner de códigos QR integrado.

## 🚀 Características Principales

*   **📊 Dashboard**: Vista general con estadísticas y accesos rápidos.
*   **🛣️ Gestión de Recorridos**:
    *   Creación y planificación de rutas (Traer/Llevar).
    *   Asignación de vehículos y conductores.
    *   Selección de niños para cada recorrido.
    *   Cálculo de costos y estadísticas mensuales.
*   **👶 Gestión de Estudiantes (Niños)**:
    *   Registro completo de estudiantes (Nombre, Dirección, Contacto).
    *   **Generación de Códigos QR** únicos para cada niño.
    *   Historial y estado de los estudiantes.
*   **📱 Escáner QR Integrado**:
    *   Módulo de escaneo para registrar el abordaje/descenso de los niños.
    *   Validación en tiempo real.
    *   Historial de escaneos recientes en el dispositivo.
*   **🚐 Gestión de Vehículos**: Administración de la flota de transporte.
*   **🔐 Seguridad**: Autenticación de usuarios y rutas protegidas.

## 🛠️ Tecnologías Utilizadas

*   **Frontend**: React 19, Vite
*   **Estilos**: TailwindCSS (Diseño Responsive y Dark Mode)
*   **Base de Datos / Backend**: Supabase (Integración API)
*   **Móvil**: Capacitor (Soporte nativo para iOS/Android)
*   **Librerías Clave**:
    *   `html5-qrcode`: Para el escaneo de códigos QR.
    *   `react-router-dom`: Navegación y rutas.
    *   `lucide-react`: Iconografía moderna.
    *   `jspdf`: Generación de reportes PDF.

## 📦 Instalación y Despliegue

1.  **Clonar el repositorio**:
    ```bash
    git clone <url-del-repositorio>
    cd recorridos-app
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Ejecutar en desarrollo**:
    ```bash
    npm run dev
    ```

4.  **Construir para producción**:
    ```bash
    npm run build
    ```

## 📱 Compilación Móvil (Capacitor)

Para sincronizar y abrir el proyecto en plataformas nativas:

```bash
npx cap sync
npx cap open android  # O ios
```
