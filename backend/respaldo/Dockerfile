# Contenedor de la tarea de respaldo. pg_dump 17 puede volcar servidores 15–17.
FROM postgres:17-alpine
RUN apk add --no-cache curl
COPY respaldo.sh /usr/local/bin/respaldo.sh
RUN chmod +x /usr/local/bin/respaldo.sh
VOLUME ["/respaldos"]
# Cron interno: todos los días a las 03:00 hora de Mendoza (06:00 UTC)
RUN echo "0 6 * * * /usr/local/bin/respaldo.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root
CMD ["crond", "-f", "-l", "8"]
