#!/bin/sh
set -e

# migrate をバックグラウンドで実行し、serve をすぐ起動（ヘルスチェック通過を早める）
php artisan migrate --force &
# migrate の接続確立を待つ
sleep 3
# デフォルトコミュニティを投入
php artisan db:seed --force 2>/dev/null || true
# Railway の PORT でリッスン（必須）
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
