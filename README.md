# 🤔 Kantify - Explorador de Ética Kantiana

<div align="center">

**Una aplicación web interactiva que aplica el Imperativo Categórico de Kant para reflexionar sobre las implicaciones éticas de nuestras decisiones**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Groq](https://img.shields.io/badge/Groq-FF6600?style=for-the-badge&logo=ai&logoColor=white)](https://groq.com/)

</div>

---

## 📋 Tabla de Contenidos

- [Resumen](#-resumen)
- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Mejores Prácticas](#-mejores-prácticas)
- [Roadmap](#-roadmap)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 🎯 Resumen

**Kantify** es una plataforma web que permite a los usuarios explorar dilemas éticos y reflexionar sobre las consecuencias de universalizar sus decisiones, siguiendo el **Imperativo Categórico** de Immanuel Kant.

### Filosofía del Proyecto

El proyecto se basa en la pregunta kantiana fundamental:

> **"¿Qué pasaría si todos actuaran como tú?"**

A través de dilemas éticos interactivos, los usuarios exploran cómo sus decisiones individuales afectarían al mundo si todos las adoptaran como ley universal.

---

## ✨ Características

### 🔒 Privacidad y Anonimato
- **100% anónimo**: Sin registro de usuarios ni recolección de datos personales
- **Persistencia local**: Los datos se almacenan únicamente en el navegador del usuario
- **Sin tracking**: Cero seguimiento de actividad o analytics invasivos

### 🧠 Inteligencia Artificial
- **Generación dinámica de dilemas**: Dilemas éticos personalizados generados con IA
- **Reflexiones kantianas**: Narrativas "Y si todos..." generadas automáticamente
- **Powered by Groq**: Modelos LLaMA 3.3 de código abierto y gratuitos
- **RAG (Retrieval-Augmented Generation)**: Dilemas contextualizados basados en tus respuestas previas

### 🎨 Experiencia de Usuario
- **Interfaz intuitiva**: Diseño limpio y accesible con ShadCN UI
- **Respuestas matizadas**: Sliders continuos (0.00 - 1.00) para respuestas más precisas
- **Feedback visual en tiempo real**: Valor actual visible mientras ajustas tu respuesta
- **Perfil ético exportable**: Descarga tu perfil en PDF

### 📊 Tópicos Éticos
1. ⏰ **Temporalidad Moral**: Decisiones que afectan al futuro
2. 👥 **Alteridad Radical**: Empatía y perspectiva del otro
3. ⚖️ **Imperativo de Universalización**: Principios universalizables
4. 🔍 **Ontología de la Ignorancia**: Límites del conocimiento moral
5. 💰 **Economía Moral del Deseo**: Ética del consumo y el deseo
6. 🏠 **Microética Cotidiana**: Decisiones éticas del día a día

---

## 🛠 Stack Tecnológico

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) con App Router
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI**: [ShadCN UI](https://ui.shadcn.com/)
- **Iconos**: [Lucide React](https://lucide.dev/)

### Inteligencia Artificial
- **Proveedor**: [Groq](https://groq.com/) (Gratuito)
- **Modelo**: LLaMA 3.3 70B Versatile
- **SDK**: groq-sdk
- **Funciones**: Generación de dilemas y reflexiones kantianas

### Estado y Persistencia
- **Gestión de Estado**: React Context API
- **Persistencia**: LocalStorage (cliente)
- **Validación**: Zod

### DevOps
- **Control de versiones**: Git
- **Gestor de paquetes**: npm
- **Bundler**: Turbopack (Next.js 15)
- **Variables de entorno**: dotenv

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────┐
│          Usuario (Navegador)            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        Next.js Frontend (React)         │
│  ┌───────────────────────────────────┐  │
│  │    App Router (Pages/Routes)      │  │
│  │  /dilemmas    /profile    /       │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │     Context API (Estado Global)   │  │
│  │  - AppContext (sesión, dilemas)   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │      LocalStorage (Cliente)       │  │
│  │  - Respuestas anónimas            │  │
│  │  - UUID de sesión                 │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │ Server Actions
                  ▼
┌─────────────────────────────────────────┐
│       Next.js Server (Backend)          │
│  ┌───────────────────────────────────┐  │
│  │   AI Flows (Server Actions)       │  │
│  │  - generateKantianNarrative()     │  │
│  │  - generatePersonalizedDilemma()  │  │
│  └───────────────┬───────────────────┘  │
└──────────────────┼─────────────────────┘
                   │ API REST
                   ▼
┌─────────────────────────────────────────┐
│            Groq API (LLaMA 3.3)         │
│  - Generación de dilemas éticos         │
│  - Reflexiones kantianas                │
│  - JSON mode para respuestas            │
└─────────────────────────────────────────┘
```

---

## 🚀 Instalación

### Prerrequisitos
- **Node.js**: >= 18.x
- **npm**: >= 9.x (viene con Node.js)
- **Cuenta Groq**: [Obtener API Key gratuita](https://console.groq.com/)

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/kantify.git
   cd kantify
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env.local
   ```

   Edita `.env.local` y agrega tu API key de Groq:
   ```env
   GROQ_API_KEY=tu_clave_groq_aqui
   ```

4. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**

   Visita [http://localhost:9002](http://localhost:9002)

---

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Requerido | Default |
|----------|-------------|-----------|---------|
| `GROQ_API_KEY` | API Key de Groq para modelos LLaMA | ✅ Sí | - |

### Obtener tu API Key de Groq (Gratis)

1. Ve a [https://console.groq.com/](https://console.groq.com/)
2. Crea una cuenta gratuita
3. Navega a "API Keys"
4. Crea una nueva key
5. Cópiala y pégala en `.env.local`

---

## 📖 Uso

### Flujo de Usuario

1. **Inicio**: El usuario llega a la página de inicio
2. **Sesión anónima**: Se genera automáticamente un UUID de sesión
3. **Dilemas**: Se presentan dilemas éticos uno a uno
4. **Respuesta**: El usuario responde con un slider (0.00 - 1.00)
5. **Reflexión**: La IA genera una reflexión kantiana personalizada
6. **Perfil**: El usuario puede ver y descargar su perfil ético

### Interpretación de Valores

- **0.00**: ❌ No / Rechazo total de la acción
- **0.50**: 🤔 Neutral / Indeciso
- **1.00**: ✅ Sí / Aceptación total de la acción

Los valores intermedios permiten expresar matices éticos más precisos.

---

## 📁 Estructura del Proyecto

```
kantify/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Página de inicio
│   │   ├── dilemmas/             # Página de dilemas
│   │   │   └── page.tsx
│   │   ├── profile/              # Página de perfil
│   │   │   └── page.tsx
│   │   └── layout.tsx            # Layout global
│   │
│   ├── ai/                       # Lógica de IA
│   │   └── flows/
│   │       ├── generate-dilemma.ts           # Generación de dilemas
│   │       └── kantian-reflection-narrative.ts  # Reflexiones kantianas
│   │
│   ├── components/               # Componentes React
│   │   ├── ui/                   # ShadCN UI components
│   │   ├── Navbar.tsx
│   │   └── ...
│   │
│   ├── contexts/                 # React Context API
│   │   └── AppContext.tsx        # Estado global de la app
│   │
│   ├── lib/                      # Utilidades
│   │   ├── groq-client.ts        # Cliente Groq configurado
│   │   ├── api-client.ts         # Cliente API RAG
│   │   ├── types.ts              # Tipos TypeScript
│   │   └── utils.ts              # Funciones auxiliares
│   │
│   └── data/                     # Datos estáticos
│       └── corpus_dilemas.json   # Corpus de dilemas iniciales
│
├── public/                       # Archivos estáticos
├── .env.local                    # Variables de entorno (NO subir a Git)
├── .env.example                  # Template de variables de entorno
├── .gitignore                    # Archivos ignorados por Git
├── package.json                  # Dependencias del proyecto
├── tsconfig.json                 # Configuración TypeScript
├── tailwind.config.ts            # Configuración Tailwind
├── next.config.ts                # Configuración Next.js
└── README.md                     # Este archivo
```

---

## 🎯 Mejores Prácticas

### Seguridad
- ✅ **API Keys en variables de entorno**: Nunca en el código
- ✅ **.env.local en .gitignore**: No subir credenciales a Git
- ✅ **Server Actions**: Lógica de IA en el servidor
- ✅ **Validación con Zod**: Inputs validados antes de procesarse

### Código Limpio
- ✅ **TypeScript estricto**: Tipado completo
- ✅ **Componentes reutilizables**: DRY (Don't Repeat Yourself)
- ✅ **Nomenclatura clara**: Variables y funciones descriptivas
- ✅ **Comentarios útiles**: Documentación inline cuando es necesario

### Performance
- ✅ **Server Actions**: Reducen bundle size del cliente
- ✅ **Turbopack**: Bundler ultrarrápido de Next.js 15
- ✅ **Lazy loading**: Componentes cargados bajo demanda
- ✅ **LocalStorage**: Evita llamadas innecesarias al servidor

### UX/UI
- ✅ **Feedback visual**: Estados de carga y errores claros
- ✅ **Responsive design**: Funciona en mobile, tablet y desktop
- ✅ **Accesibilidad**: ARIA labels y navegación por teclado
- ✅ **Valores decimales visibles**: Transparencia en las respuestas

---

## 🗺 Roadmap

### ✅ Fase 1: MVP (Completado)
- [x] Configuración del proyecto con Next.js 15
- [x] Sistema de dilemas del corpus
- [x] Integración con Groq (LLaMA 3.3)
- [x] Sliders interactivos con valores decimales
- [x] Reflexiones kantianas generadas por IA
- [x] Perfil ético descargable en PDF

### 🚧 Fase 2: Mejoras (En desarrollo)
- [ ] Visualizaciones interactivas con Recharts
- [ ] Sistema de niveles de dilemas progresivos
- [ ] Mundos distópicos/utópicos generados por IA
- [ ] Redes neuronales bayesianas para análisis de perfil
- [ ] Modo oscuro/claro

### 🔮 Fase 3: Futuro
- [ ] Comparación anónima agregada de perfiles
- [ ] Dilemas generados por la comunidad
- [ ] Traducción a múltiples idiomas
- [ ] Modo educativo para instituciones
- [ ] API pública para desarrolladores

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Este es un proyecto personal, pero si quieres colaborar:

1. **Fork** el proyecto
2. Crea una **rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### Guía de Contribución
- Sigue las convenciones de código existentes
- Escribe tests si es aplicable
- Actualiza la documentación si es necesario
- Mantén los commits claros y descriptivos

---

## 📄 Licencia

Este proyecto es de uso personal y educativo.

---

## 🙏 Agradecimientos

- **Immanuel Kant**: Por el Imperativo Categórico
- **Groq**: Por proporcionar acceso gratuito a LLaMA 3.3
- **Vercel**: Por Next.js
- **ShadCN**: Por los componentes UI

---

## 📞 Contacto

**Proyecto personal** - Para consultas o feedback, abre un issue en GitHub.

---

<div align="center">

**Hecho con 🧠 y ❤️ para la reflexión ética**

[⬆ Volver arriba](#-kantify---explorador-de-ética-kantiana)

</div>
