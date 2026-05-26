FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/admin/package.json apps/admin/package.json

RUN npm ci --workspaces

COPY packages/core/prisma packages/core/prisma
COPY packages/core/src packages/core/src
COPY packages/core/tsconfig.json packages/core/tsconfig.json
COPY apps/admin apps/admin

RUN cd packages/core && npx prisma generate
RUN npm -w apps/admin run build

EXPOSE 3001
CMD ["npm", "-w", "apps/admin", "run", "start"]
