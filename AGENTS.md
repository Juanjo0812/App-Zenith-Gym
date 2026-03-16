REGLAS DEL PROYECTO

1. Uso de servicios de IA

No se deben ejecutar modelos de lenguaje ni modelos de embeddings localmente.

Todas las capacidades de IA deben consumirse mediante APIs externas.

Proveedores recomendados:

- OpenRouter
- Groq

2. Gestión de secretos

Nunca se deben almacenar claves API o tokens en el código.

Todas las credenciales deben cargarse desde variables de entorno usando un archivo `.env`.

3. Gestión del idioma

Todo el texto visible para el usuario debe estar en español.

No mezclar inglés y español en ninguna parte de la UI.

No crear diccionarios manuales de traducción como TRANSLATIONS.

Si el backend devuelve texto en inglés, transformarlo directamente a español antes de renderizarlo.

Formato de capitalización en español.

Usar capitalización normal de español.

Ejemplo correcto:
Press de banca

Ejemplo incorrecto:
Press de Banca

Solo la primera palabra debe ir en mayúscula salvo nombres propios.

Estas reglas deben aplicarse a todos los textos renderizados en cualquier archivo que sea parte de la UI.
