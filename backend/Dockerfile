FROM php:8.4-cli-alpine

RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    gmp-dev \
    linux-headers \
    nodejs \
    npm \
    $PHPIZE_DEPS \
    && docker-php-ext-install \
        pdo_pgsql \
        pgsql \
        zip \
        mbstring \
        intl \
        opcache \
        pcntl \
        gmp \
        bcmath \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS linux-headers

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts

COPY . .

RUN composer run-script post-autoload-dump 2>/dev/null || true \
    && php artisan config:clear 2>/dev/null || true \
    && php artisan route:clear 2>/dev/null || true \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8080

CMD sh -c 'php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8080}'
