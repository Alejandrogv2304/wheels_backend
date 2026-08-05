## Como levantar el backend en dev con Docker?

Ejecuta estos doc comandos en terminal:

docker build -t wheels-backend .
docker run --rm -p 3000:3000 --env-file .env wheels-backend

