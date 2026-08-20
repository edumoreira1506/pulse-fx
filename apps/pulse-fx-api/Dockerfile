FROM docker.io/node:lts-alpine

WORKDIR /app

ENV HOST=0.0.0.0
ENV PORT=3333

RUN addgroup --system pulse-fx-api && \
    adduser --system -G pulse-fx-api pulse-fx-api

COPY dist/main.js ./main.js

RUN npm install --omit=dev express@4.21.2 axios@1.19.0 pg@8.23.0 typeorm@1.1.0 reflect-metadata@0.2.2 && \
    chown -R pulse-fx-api:pulse-fx-api /app

USER pulse-fx-api

EXPOSE 3333

CMD ["node", "main.js"]
