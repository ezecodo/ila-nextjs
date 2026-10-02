# Disco del servidor — temporales de Nextcloud Office (Collabora)

Runbook para cuando el disco del servidor Hetzner de ila se llena. Escrito a partir del incidente del 2026-10-02.

## Resumen

- **Síntoma**: mail de Hetzner avisando que la partición `usr` está al 90 % (`/dev/mapper/vg-usr`, 138 GB).
- **Causa**: el Collabora integrado de **Nextcloud Office**, que corre en el mismo servidor que la web, deja una carpeta temporal de ~650 MB en `~/.tmp/` cada vez que arranca y nunca borra la anterior.
- **No es** la app de ila (Next.js), ni los uploads, ni los backups, ni el volumen de archivos que el equipo sube a Nextcloud.
- **Solución**: borrar las carpetas huérfanas + un cron diario que no deje acumular más de una.

## Contexto del servidor

- Servidor: `ilaweb@dedivirt2805` (`162.55.222.220`), managed server de Hetzner, login por password, sin sudo.
- Home: `/usr/home/ilaweb/` — está en la partición `/usr`, la que se llena.
- Nextcloud: webroot en `/usr/www/users/ilaweb` (`~/public_html` es un enlace ahí).
- Temporales de PHP/Nextcloud/Collabora: `~/.tmp/`.

## Qué hay en `~/.tmp/`

| Patrón | Qué es | Peso |
|---|---|---|
| `coolwsd.XXXXXXXXXX/` | Entorno de un arranque de Collabora: `systemplate/` (copia de LibreOffice y librerías del sistema), `jails/` (recinto donde se abre cada documento) y `coolwsd.log` | **~656 MB cada una** |
| `coolwsd.pid` | PID del Collabora que está corriendo ahora | — |
| `lu*.tmp/` | Carpetas temporales de LibreOffice, vacías | 4 KB cada una (miles, ~12 MB en total) |
| `sess_*` | Sesiones PHP de Nextcloud | despreciable |

Collabora arranca casi cada día que alguien abre un documento, así que se acumula **una carpeta de ~650 MB por día de uso**. En cinco meses (29 de abril → 1 de octubre de 2026) se juntaron 76 carpetas ≈ 50 GB.

**No contienen documentos del equipo.** Los archivos reales viven en los datos de Nextcloud; estas carpetas son el entorno de trabajo de procesos que ya terminaron.

**La carpeta en uso es siempre la más nueva** (tiene la misma fecha y hora que `coolwsd.pid`). Esa no se borra.

## Diagnóstico (solo lectura)

`du` es muy lento en este servidor (minutos). Conviene listar y medir carpetas puntuales en vez de barrer todo el home.

```
df -h /usr
```

```
ls -d ~/.tmp/coolwsd.*/ | wc -l
```

```
ls -ldtr ~/.tmp/coolwsd.*
```

```
ps aux | grep -i coolwsd | grep -v grep
```

Si hay decenas de carpetas `coolwsd.*`, es este problema: cantidad × 0,65 GB ≈ espacio recuperable.

## Limpieza manual

Hacerla preferentemente fuera del horario de trabajo del equipo: borrar decenas de GB de archivos chicos carga el disco unos minutos y Nextcloud puede ir más lento mientras tanto. `nice` baja la prioridad del borrado.

### Opción A — todas menos la más nueva

```
ls -dt ~/.tmp/coolwsd.*/ | tail -n +2 | wc -l
```

```
ls -dt ~/.tmp/coolwsd.*/ | tail -n +2 | xargs -r nice -n 19 rm -rf
```

### Opción B — conservadora, hasta una fecha

Deja intacto todo lo posterior a la fecha indicada. Es la que se usó el 2026-10-02 (en plena semana de layout de un dossier).

```
find ~/.tmp -maxdepth 1 -type d -name 'coolwsd.*' ! -newermt '2026-08-30' | wc -l
```

```
find ~/.tmp -maxdepth 1 -type d -name 'coolwsd.*' ! -newermt '2026-08-30' -exec nice -n 19 rm -rf {} +
```

Siempre correr primero la versión con `wc -l` (cuenta, no borra) y comprobar que el número cierra.

### Verificar

```
df -h /usr
```

Progreso mientras borra, desde otra terminal:

```
ls -d ~/.tmp/coolwsd.*/ | wc -l
```

### Por qué no borrar por antigüedad con `-mtime` en automático

Si Collabora pasa varios días sin reiniciarse, su carpeta en uso también es "vieja" y un `-mtime +N` la borraría. La regla "todas menos la más nueva" no depende de cuánto lleve vivo el proceso. Un corte por fecha fija (opción B) solo sirve para una limpieza manual puntual.

## Prevención — cron diario

Agregar con `crontab -e`, junto a las líneas de los backups:

```
0 5 * * * ls -dt /usr/home/ilaweb/.tmp/coolwsd.*/ 2>/dev/null | tail -n +2 | xargs -r rm -rf
```

- Corre a las 05:00, después de los backups (03:00 y 03:30) y antes del horario de trabajo.
- Deja solo la carpeta más nueva: nunca habrá más de ~650 MB de temporales de Collabora.
- El patrón termina en `/`, así que solo toma directorios y no toca `coolwsd.pid`.

## Alternativas evaluadas

| Opción | A favor | En contra |
|---|---|---|
| **Cron diario** (elegida) | Una línea, no cambia nada para quienes usan Nextcloud | Trata el síntoma: Collabora sigue generando la carpeta |
| Desactivar Nextcloud Office | Elimina la causa | El equipo pierde la edición de documentos en el navegador, que usa a diario |
| Mover Nextcloud a otro servidor | Un problema de Nextcloud deja de poder tumbar la web | Migración + costo de otro servidor |
| Ampliar el servidor (propuesta de Hetzner) | — | No resuelve nada: el disco nuevo se llenaría igual, solo más tarde |

## Historial

- **Abril 2026 (aprox.)** — primera vez que se llenó el disco; se borraron temporales a mano. No se dejó prevención ni documentación.
- **2026-10-02** — aviso de Hetzner (90 %, 117 GB de 138 GB). Diagnóstico: 76 carpetas `coolwsd.*`. Se borraron las 63 anteriores al 30 de agosto: el disco pasó de **117 GB usados (90 %) a 73 GB (57 %)**, 44 GB liberados y 58 GB libres. Quedan 13 carpetas (septiembre y 1 de octubre), 12 de ellas huérfanas (~8 GB).

- **2026-10-02 (segunda causa)** — al medir el resto apareció `~/.pm2/logs/ilaweb-out.log` con **24 GB**: Prisma registraba cada consulta SQL en producción (`log: ["query", …]` en `src/lib/prisma.js`) y `src/lib/api/articles.js` imprimía un cartel de depuración en cada carga de artículo. Se vació con `pm2 flush` (no reinicia la web): **73 GB → 50 GB (39 %)**, 81 GB libres. Esto es de la web de ila, no de Nextcloud.

### Reparto del disco medido el 2026-10-02 (antes del `pm2 flush`)

| Bloque | Tamaño |
|---|---|
| `~/.pm2/logs` (logs de la web) | 24 GB → ~0 tras el flush |
| Nextcloud (`/usr/www/users/ilaweb/nextcloud`, programa + archivos) | 11 GB |
| `~/.tmp` (temporales de Collabora restantes) | 11 GB |
| `~/.npm` (caché, borrable con `npm cache clean --force`) | 4,4 GB |
| Herramientas (`.linuxbrew`, `.rustup`, `.cargo`, `.nvm`, `.cache`) | ~3,9 GB |
| Proyecto de ila: `~/ilaweb` 2,1 + `~/ila-uploads` 1,7 + `~/backups` 0,9 | 4,7 GB |
| `~/www_logs` | 0,8 GB |
| Matomo | 0,26 GB |

El resto hasta el total usado es sistema y bases de datos (no medible con `du` desde la cuenta).

### Si el disco vuelve a crecer: mirar también los logs de PM2

```
ls -lhS ~/.pm2/logs | head
```

```
pm2 flush
```

No borrar esos archivos con `rm`: PM2 los tiene abiertos y el espacio no se libera hasta reiniciar los procesos.

## Pendiente

- [ ] Apagar el log de consultas de Prisma en producción y quitar el cartel de depuración de `articles.js`, y deployar. Hasta entonces `ilaweb-out.log` crece ~2 GB por mes.
- [ ] Decidir la prevención de los temporales de Collabora: cron diario, la misma línea dentro de `backup-db.sh`, o limpieza manual cada 2–3 meses. Sin prevención, al ritmo actual (~650 MB por día de uso) el disco vuelve al 90 % en unos 4–5 meses.
- [ ] Borrar las 12 huérfanas restantes de septiembre (lo hace la limpieza automática en su primera corrida, o la opción A a mano).
- [ ] Medir qué ocupa el resto del disco (73 GB): datos de Nextcloud, `~/ila-uploads`, `~/backups`, `~/.pm2/logs`, `~/.npm`. No se llegó a medir en el incidente.
- [ ] Opcional: alerta propia de disco (p. ej. que el script de backup reporte el `%` usado al dashboard de Backups), para no depender del mail de Hetzner.
