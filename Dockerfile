# Dockerfile (Linux, works on Render & locally)
FROM debian:bookworm

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
  build-essential cmake git curl ca-certificates \
  libjsoncpp-dev uuid-dev zlib1g-dev libssl-dev libbrotli-dev \
  && rm -rf /var/lib/apt/lists/*

# Build and install Trantor
RUN git clone --depth 1 https://github.com/an-tao/trantor.git \
 && cd trantor && mkdir build && cd build \
 && cmake .. -DCMAKE_BUILD_TYPE=Release \
 && make -j$(nproc) && make install

# Build and install Drogon
RUN git clone --depth 1 https://github.com/drogonframework/drogon.git \
 && cd drogon && mkdir build && cd build \
 && cmake .. -DCMAKE_BUILD_TYPE=Release \
 && make -j$(nproc) && make install

WORKDIR /app
COPY . /app

RUN mkdir -p build && cd build \
 && cmake .. -DCMAKE_BUILD_TYPE=Release \
 && make -j$(nproc)

ENV PORT=8080
EXPOSE 8080

# DeepSeek env are set in Render dashboard (do NOT hardcode secrets here)
CMD ["./build/OOPQuizBot"]
