# Use a lightweight base image
FROM ubuntu:22.04

# Set environment variables to avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    default-jre \
    unzip \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install apkeep
RUN wget https://github.com/EFForg/apkeep/releases/download/0.17.0/apkeep-x86_64-unknown-linux-gnu -O /usr/local/bin/apkeep \
    && chmod +x /usr/local/bin/apkeep

# Install apktool
RUN wget https://raw.githubusercontent.com/iBotPeaches/Apktool/master/scripts/linux/apktool -O /usr/local/bin/apktool \
    && chmod +x /usr/local/bin/apktool \
    && wget https://bitbucket.org/iBotPeaches/apktool/downloads/apktool_2.7.0.jar -O /usr/local/bin/apktool.jar \
    && chmod +x /usr/local/bin/apktool.jar

# Create directories for the script and output
RUN mkdir -p /app /output

# Copy the shell script into the container
COPY download_decompile_extract.sh /app/download_decompile_extract.sh
RUN chmod +x /app/download_decompile_extract.sh

# Set the working directory
WORKDIR /app

# Run the script
CMD ["./download_decompile_extract.sh"]