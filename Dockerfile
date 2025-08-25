# ---------- Build stage (has Drogon toolchain preinstalled)
FROM drogonframework/drogon:latest AS build
WORKDIR /app
COPY . .
RUN mkdir -p build && cd build \
 && cmake -DCMAKE_BUILD_TYPE=Release .. \
 && cmake --build . --config Release -j

# ---------- Runtime stage
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/build/OOPQuizBot /app/OOPQuizBot
COPY public public
COPY data data
EXPOSE 8080
CMD ["./OOPQuizBot"]
