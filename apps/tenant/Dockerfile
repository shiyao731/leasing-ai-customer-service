FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/tenant/package.json apps/tenant/package.json

RUN npm ci --workspaces

COPY packages/core/prisma packages/core/prisma
COPY packages/core/src packages/core/src
COPY packages/core/tsconfig.json packages/core/tsconfig.json
COPY apps/tenant apps/tenant

RUN cd packages/core && npx prisma generate
RUN npm -w apps/tenant run build

EXPOSE 3000
CMD ["npm", "-w", "apps/tenant", "run", "start"]
