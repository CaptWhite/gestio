#!/bin/bash

# Configuración
CONTAINER_NAME="gestio-db"
DB_NAME="gestio"
DB_USER="captwhite"
DB_PASSWORD="tasques@ADMIN"
BACKUP_DIR="$(dirname "$0")/../backups"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

show_menu() {
    echo "=========================================="
    echo "MariaDB Docker Backup & Restore (Linux)"
    echo "=========================================="
    echo "1. Backup (Copia de seguridad)"
    echo "2. Restore (Restaurar copia)"
    echo "3. Salir"
    echo "=========================================="
    read -p "Selecciona una opción (1-3): " opcion
}

do_backup() {
    read -p "Introduce el nombre del archivo de backup (por defecto: gestio_backup.sql): " filename
    if [ -z "$filename" ]; then
        filename="gestio_backup.sql"
    fi
    BACKUP_FILE="$BACKUP_DIR/$filename"

    echo "Realizando backup en $BACKUP_FILE..."
    # Ejecutamos docker exec sin la opción -t para evitar caracteres de control de TTY
    docker exec -i "$CONTAINER_NAME" mariadb-dump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        echo "Backup completado con éxito."
    else
        echo "Error al realizar el backup."
    fi
}

do_restore() {
    read -p "Introduce el nombre del archivo de backup a restaurar (en la carpeta $BACKUP_DIR): " filename
    if [ -z "$filename" ]; then
        echo "Debes especificar un archivo."
        return
    fi
    RESTORE_FILE="$BACKUP_DIR/$filename"

    if [ ! -f "$RESTORE_FILE" ]; then
        echo "El archivo $RESTORE_FILE no existe."
        return
    fi

    echo "Restaurando base de datos desde $RESTORE_FILE..."
    docker exec -i "$CONTAINER_NAME" mariadb -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$RESTORE_FILE"

    if [ $? -eq 0 ]; then
        echo "Restauración completada con éxito."
    else
        echo "Error al realizar la restauración."
    fi
}

while true; do
    show_menu
    case $opcion in
        1) do_backup ;;
        2) do_restore ;;
        3) exit 0 ;;
        *) echo "Opción no válida." ;;
    esac
    echo ""
    read -p "Presiona [Enter] para continuar..." temp
    clear
done
