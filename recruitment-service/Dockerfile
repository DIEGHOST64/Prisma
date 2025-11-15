FROM php:8.2-fpm-alpine

# Instalar extensiones de PHP necesarias
RUN apk add --no-cache \
    postgresql-dev \
    && docker-php-ext-install pdo pdo_pgsql

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Crear directorio de trabajo
WORKDIR /var/www/html

# Copiar archivos de dependencias
COPY composer.json composer.lock* ./

# Instalar dependencias de PHP
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Copiar el resto de la aplicación
COPY . .

# Crear usuario no-root
RUN addgroup -g 1001 -S phpuser && \
    adduser -S phpuser -G phpuser -u 1001 && \
    chown -R phpuser:phpuser /var/www/html

USER phpuser

# Exponer puerto
EXPOSE 3002

# Comando de inicio
CMD ["php", "-S", "0.0.0.0:3002", "-t", "public"]
