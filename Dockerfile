FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Bagian Runner ---
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy file public dan static (penting untuk gambar/aset)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Copy folder standalone (hasil build yang benar)
COPY --from=builder /app/.next/standalone ./

# Buat folder data untuk database
RUN mkdir -p /app/data

# Port
EXPOSE 3000

# GANTI CMD: Jangan "npm start", tapi jalankan server.js langsung
CMD ["node", "server.js"]