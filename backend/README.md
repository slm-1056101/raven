# Backend

This folder contains the backend services for the Raven project.

Quick start
-----------

- Install dependencies:

  npm install

- Run the development server:

  npm run dev

or

  npm start

Environment
-----------

- Copy `.env.example` to `.env` and update values as needed.

Notes
-----

- See the repository root README.md for overall project information.

Laravel setup
-------------

This repository can host a Laravel backend in this folder. A convenience script is provided to install PHP/Composer and create a Laravel project here.

Run from the repository root:

  ./backend/setup.sh

The script checks for Homebrew, installs PHP and Composer if missing, and runs `composer create-project laravel/laravel .` to create the project. If you prefer to install tools manually, follow the Composer and PHP installation guides for macOS.

After creation, run `php artisan serve` or configure your web server and `.env` file as usual.
