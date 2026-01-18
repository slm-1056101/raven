#!/usr/bin/env bash
set -euo pipefail

echo "This script will help install PHP, Composer, and create a Laravel project in this folder."

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew not found. Please install Homebrew first: https://brew.sh/"
  exit 1
fi

if ! command -v php >/dev/null 2>&1; then
  echo "Installing PHP via Homebrew..."
  brew update
  brew install php
fi

if ! command -v composer >/dev/null 2>&1; then
  echo "Installing Composer..."
  EXPECTED_SIGNATURE=$(curl -s https://composer.github.io/installer.sig)
  php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
  php -r "if (hash_file('sha384', 'composer-setup.php') === '$EXPECTED_SIGNATURE') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); exit(1); }"
  php composer-setup.php --quiet
  php -r "unlink('composer-setup.php');"
  mv composer.phar /usr/local/bin/composer 2>/dev/null || mv composer.phar ~/.composer/composer.phar || true
fi

echo "Creating Laravel project (this will download dependencies)..."
composer create-project laravel/laravel . --prefer-dist --no-interaction

echo "Laravel project created. Run 'php artisan serve' or follow README.md for next steps."
