<div align="center">

# 🚀 LvdCord API — NestJS Backend

  <p>
    REST API и WebRTC сервис авторизации, серверов, текстовых каналов и личных бесед для плаформы <b>LvdCord</b>.
  </p>

![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC-FF4F00?style=for-the-badge)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI_3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

</div>

---

## 📌 Ключевые возможности

- 🔐 **Гибридная авторизация**:
    - Вход по почте и паролю (Bcrypt хэширование).
    - OAuth 2.0 авторизация через **Yandex** и **Discord** (Passport.js).
    - Верификация почты по ссылкам-токенам (Nodemailer).
    - Защищенные JWT-сессии с двойным токеном (`access_token` в заголовке, `refresh_token` в HttpOnly куках).
- 🛡️ **Динамические роли и права (RBAC)**:
    - Создание кастомных ролей с цветными никнеймами и точечными флагами прав (`RolePermissions`).
    - Кастомный `ServerPermissionsGuard` для защиты административных действий.
- 🎙️ **Интеграция с LiveKit WebRTC**:
    - Генерация безопасных JWT-токенов для подключения к аудио/видео комнатам.
    - Гибридный `LivekitChannelGuard` (валидация серверов и личных бесед).
    - Обработка входящих вебхуков от серверного SDK LiveKit.
- 💬 **Чаты и Личные сообщения (DMs)**:
    - Поддержка серверов, текстовых/голосовых каналов и личных бесед 1-на-1.
    - Поддержка групповых чатов (Group DMs).
    - Защищенные гарды авторства сообщений (`DirectMessageOwnerGuard`, `ChannelMessageOwnerGuard`).
- 👥 **Система Друзей**:
    - Запросы в друзья (Pending/Accepted/Blocked), нормализованная выгрузка связей.
- 📖 **Интерактивная Swagger-документация**:
    - Авто-генерация схем DTO через CLI-плагин NestJS.
    - `persistAuthorization: true` для сохранения токена при перезагрузке.

---

## 🛠️ Технологический стек

- **Фреймворк**: NestJS (TypeScript)
- **База данных**: PostgreSQL
- **ORM**: Prisma ORM
- **Кэш / Сессии**: Redis (in dev...)
- **Медиа-сервер**: LiveKit Server SDK
- **Авторизация**: Passport.js (JWT, Local, Yandex OAuth, Discord OAuth)
- **Документация**: Swagger / OpenAPI 3.0

---

## ⚙️ Быстрый старт

### 1. Требования

- Node.js >= 18.x
- Docker & Docker Compose (для локального PostgreSQL и Redis)

### 2. Установка зависимостей

```bash
npm install
```
