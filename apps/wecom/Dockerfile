FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/wecom/package.json apps/wecom/package.json

RUN npm ci --workspaces

COPY packages/core/prisma packages/core/prisma
COPY packages/core/src packages/core/src
COPY packages/core/tsconfig.json packages/core/tsconfig.json
COPY apps/wecom apps/wecom

RUN cd packages/core && npx prisma generate
RUN npm -w apps/wecom run build

EXPOSE 3002
CMD ["npm", "-w", "apps/wecom", "run", "start"]
