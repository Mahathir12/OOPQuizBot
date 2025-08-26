# ---------- Stage 1: build ----------
FROM drogonframework/drogon:latest AS build
WORKDIR /src

# Copy sources
COPY CMakeLists.txt .
COPY src ./src
COPY include ./include
COPY public ./public
COPY config.json .  # optional

# Configure & build release
RUN cmake -DCMAKE_BUILD_TYPE=Release .
RUN cmake --build . --target OOPQuizBot -- -j$(nproc)

# ---------- Stage 2: runtime ----------
FROM ubuntu:22.04
WORKDIR /app

# Drogon binary links to OpenSSL + zlib
RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl3 zlib1g ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy the app and static assets
COPY --from=build /src/OOPQuizBot /app/OOPQuizBot
COPY --from=build /src/public /app/public

# Render passes $PORT; we just listen on it
ENV PORT=8080
EXPOSE 8080

# Start server
CMD ["./OOPQuizBot"]
