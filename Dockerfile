# ベースイメージとして Node.js 22 を使用
FROM node:22

# 作業ディレクトリを設定
WORKDIR /app

# パッケージマネージャー pnpm をインストール
RUN npm install -g pnpm

# パッケージファイルをコピー
COPY package.json pnpm-lock.yaml ./

# 依存関係をインストール
RUN pnpm install

# アプリケーションのソースコードをコピー
COPY . .

# .env をコンテナにコピー
COPY .env /app/.env

# アプリケーションをビルド
#RUN pnpm build

# アプリケーションがリッスンするポートを指定
EXPOSE 3000

# アプリケーションの起動コマンド
#CMD ["pnpm", "start"]
#CMD ["sh", "-c", "printenv | grep POSTGRES_URL && pnpm db:migrate && pnpm start"]