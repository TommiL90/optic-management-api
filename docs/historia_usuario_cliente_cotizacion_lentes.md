# Sistema de Cotización de Lentes - Descripción para Cliente

## ¿Qué es este sistema?

Un sistema que permite a los vendedores de la óptica ingresar una receta oftalmológica (lo que el doctor recetó al paciente) y obtener instantáneamente una lista de todos los lentes disponibles con sus precios, características y tiempo de entrega.

---

## ¿Cómo funciona?

### Paso 1: El vendedor ingresa la receta del paciente

El vendedor completa un formulario web con 4 campos numéricos:

**Ojo Derecho (OD):**
- Esfera: ejemplo -4.00
- Cilindro: ejemplo -2.00

**Ojo Izquierdo (OI):**
- Esfera: ejemplo -3.75
- Cilindro: ejemplo -2.50

**Notas importantes:**
- Los valores solo pueden ir de 0.25 en 0.25 (ejemplo: -4.00, -4.25, -4.50, -4.75)
- Si el vendedor escribe un valor como -3.76, el sistema automáticamente lo redondeará a -3.75
- El sistema usa las flechas del teclado para subir/bajar de 0.25 en 0.25

### Paso 2: El vendedor selecciona el tipo de marco (OBLIGATORIO)

- Marco cerrado
- Marco semicerrado
- Marco al aire

### Paso 3: El vendedor puede aplicar filtros opcionales (si el cliente ya sabe lo que quiere)

Puede filtrar por:
- Material: orgánico, policarbonato, mineral, adelgazado
- Antirreflejo: sí/no
- Filtro azul: sí/no
- Fotocromático: sí/no
- Polarizado: sí/no
- Tipo de lente: monofocal, bifocal, multifocal

**Importante:** Estos filtros son opcionales. Si no se selecciona nada, el sistema mostrará TODOS los lentes disponibles para esa receta.

### Paso 4: El vendedor presiona "Cotizar" o Enter

El sistema busca automáticamente y muestra:

---

## ¿Qué ve el vendedor después de cotizar?

### Información de la cotización

Una tarjeta azul en la parte superior mostrando:
- **Rango usado**: por ejemplo "42-42" (código interno)
- **Descripción**: "Ambos ojos hasta 4 esfera / 2 cilindro"
- **Total de resultados**: "15 productos disponibles"

### Lista de lentes disponibles

Cada lente se muestra en una tarjeta con:

#### Información principal:
- **Nombre del producto**: "ORGANICO ANTIREFLEJO AZUL"
- **Material**: Orgánico
- **Código SKU**: ORG-AR-AZUL-42-42-CERRADO

#### Características (badges de colores):
- 🟢 Antirreflejo
- 🔵 Filtro Azul
- 🟣 Fotocromático
- 🟡 UV
- 🟠 Polarizado

#### Precios:
- **Precio al público**: $54.900 (grande y destacado)
- **Precio base**: $3.500 (más pequeño, para referencia)

#### Logística:
- ⏰ **3 días hábiles** de entrega
- 📝 **Observaciones**: "Se entrega en 3 días hábiles"

### Orden de los resultados

Los lentes se muestran **ordenados de menor a mayor precio** por defecto.

---

## Ejemplos de uso

### Ejemplo 1: Cliente con receta simple

**Receta:**
- OD: -4.00 / -2.00
- OI: -4.00 / -2.00

**Tipo de marco:** Cerrado

**Resultado:**
El sistema muestra todos los lentes para marco cerrado en el rango 4/2 - 4/2. Por ejemplo:
1. ORGANICO ANTIREFLEJO NORMAL - $39.900 - 3 días
2. ORGANICO ANTIREFLEJO AZUL - $54.900 - 3 días
3. ORGANICO FOTOCROMÁTICO GRIS CON UV Y FILTRO AZUL - $84.900 - 3 días
... (y así todos los disponibles)

### Ejemplo 2: Cliente que ya sabe que quiere filtro azul

**Receta:**
- OD: -4.00 / -2.00
- OI: -4.00 / -2.00

**Tipo de marco:** Cerrado
**Filtro azul:** Sí

**Resultado:**
El sistema solo muestra lentes orgánicos con filtro azul:
1. ORGANICO ANTIREFLEJO AZUL - $54.900 - 3 días
2. ORGANICO FOTOCROMÁTICO GRIS CON UV Y FILTRO AZUL - $84.900 - 3 días

### Ejemplo 3: Recetas diferentes en cada ojo

**Receta:**
- OD: -4.00 / -2.00 (un ojo más simple)
- OI: -4.00 / -4.00 (el otro ojo más complejo)

**Tipo de marco:** Cerrado

**Resultado:**
El sistema detecta que un ojo es 4/2 y el otro 4/4, entonces usa la tabla de precios "42-44" y muestra todos los productos de esa categoría.

---

## ¿Cómo determina el sistema qué lentes mostrar?

### 1. Clasificación por complejidad de la receta

El sistema tiene 9 tablas de precios según la complejidad de la receta:

| Código | Descripción |
|--------|-------------|
| 42-42 | Ambos ojos hasta 4 esf / 2 cyl |
| 42-44 | Un ojo hasta 4/2, el otro hasta 4/4 |
| ODI-44 | Ambos ojos hasta 4 esf / 4 cyl |
| 44-46 | Un ojo hasta 4/4, el otro hasta 4/6 |
| ODI-46 | Ambos ojos hasta 4/6 |
| 44-66 | Un ojo hasta 4/4, el otro hasta 6/6 |
| ODI-62 | Ambos ojos hasta 6/2 |
| 62-42 | Un ojo hasta 6/2, el otro hasta 4/2 |
| ODI-66 | Ambos ojos hasta 6/6 |

**Importante:** El mismo lente (ejemplo: "ORGANICO ANTIREFLEJO NORMAL") tiene **precios diferentes** en cada tabla, porque trabajar un cristal más complejo cuesta más.

### 2. El sistema busca la tabla correcta

Cuando el vendedor ingresa la receta, el sistema:
1. Redondea los valores a múltiplos de 0.25
2. Calcula qué tabla de precios usar según la complejidad de ambos ojos
3. Busca todos los productos de esa tabla
4. Filtra según el tipo de marco (obligatorio)
5. Aplica filtros opcionales si se seleccionaron
6. Ordena por precio de menor a mayor

### 3. No hay cálculos dinámicos

**Aclaración importante:** El sistema NO calcula precios sumando características.

Los precios ya están definidos en las tablas. Por ejemplo:
- "ORGANICO ANTIREFLEJO NORMAL" para receta 42-42 con marco cerrado = $39.900 (fijo)
- "ORGANICO ANTIREFLEJO NORMAL" para receta 42-44 con marco cerrado = $45.900 (fijo, diferente)

---

## Ventajas de este sistema

### Para el vendedor:
✅ **Rapidez**: Cotización instantánea (menos de 2 segundos)
✅ **Precisión**: No hay riesgo de error manual al buscar en tablas Excel
✅ **Completo**: Ve TODOS los lentes disponibles de una vez
✅ **Comparación fácil**: Los lentes están ordenados por precio
✅ **Información clara**: Características destacadas con colores

### Para el negocio:
✅ **Menos errores**: El sistema valida automáticamente que los valores sean correctos
✅ **Trazabilidad**: Se guarda registro de cada cotización (receta original, receta normalizada, qué tabla se usó)
✅ **Flexibilidad**: Fácil actualizar precios o agregar nuevos productos
✅ **Profesionalismo**: Respuesta rápida y precisa al cliente

### Para el cliente final:
✅ **Transparencia**: Ve todas las opciones disponibles con precios claros
✅ **Opciones**: Puede comparar diferentes materiales y características
✅ **Información completa**: Sabe cuándo le entregarán sus lentes

---

## Casos especiales

### ¿Qué pasa si la receta es muy compleja y no está en las tablas?

Si el vendedor ingresa una receta que excede los rangos definidos (ejemplo: -12.00 / -8.00), el sistema mostrará un mensaje:

> "No se encontró una tabla de precios que cubra esta prescripción. Por favor, consulte con el supervisor para cotización especial."

### ¿Qué pasa si no hay lentes disponibles con los filtros seleccionados?

Si el vendedor aplica filtros muy específicos (ejemplo: marco cerrado + policarbonato + polarizado + fotocromático) y no hay ningún producto que cumpla TODAS esas condiciones, el sistema mostrará:

> "No se encontraron productos con los filtros seleccionados. Intenta quitar algunos filtros para ver más opciones."

---

## Tipos de marcos explicados

### Marco Cerrado (1)
La montura rodea completamente el lente. Es la más común y económica.
- **Productos disponibles**: Categoría "MARCO: CERRADO (1)"

### Marco Semicerrado / Al Aire (2-3-4-5)
La montura solo rodea parcialmente el lente o usa nylon/tornillos.
- **Productos disponibles**: Categoría "MARCO: CERRADO, SEMI AL AIRE Y AL AIRE (2-3-4-5)"

**Nota:** El tipo de marco es importante porque algunos cristales solo están disponibles para ciertos tipos de marcos.

---

## Integración con el sistema actual

Este sistema de cotización:
- ✅ Es independiente del sistema actual de ventas
- ✅ Solo consulta los productos y precios disponibles
- ✅ NO modifica inventario
- ✅ NO genera órdenes de compra automáticamente
- ✅ Es una herramienta de consulta rápida para el vendedor

Después de ver la cotización, el vendedor sigue el proceso normal de venta en el sistema actual.

---

## Tecnologías utilizadas (simplificado)

### Backend (servidor):
- API REST que recibe la receta y devuelve los productos
- Base de datos con todas las combinaciones de precios
- Sistema de validación para evitar datos incorrectos

### Frontend (interfaz web):
- Formulario web responsive (funciona en computador, tablet, celular)
- Validación en tiempo real
- Resultados visuales con tarjetas de productos

---

## Próximos pasos recomendados

### Mejoras futuras (opcionales):

1. **Historial de cotizaciones**
   - Guardar las últimas 10 cotizaciones del vendedor
   - Poder volver a ver una cotización anterior

2. **Exportar cotización**
   - Generar PDF con los productos cotizados
   - Enviar por email al cliente

3. **Comparador**
   - Seleccionar hasta 3 productos
   - Ver comparación lado a lado de características y precios

4. **Notación abreviada**
   - En vez de escribir -4.00 y -2.00, poder escribir "42"
   - El sistema lo convierte automáticamente

5. **Sugerencias inteligentes**
   - Si el cliente tiene presupuesto limitado, sugerir alternativas más económicas
   - Si un producto está agotado, sugerir similares disponibles

---

## Preguntas frecuentes

### ¿El vendedor puede modificar los precios mostrados?
No, los precios son fijos según las tablas definidas por el negocio.

### ¿Qué pasa si un producto está agotado?
Los productos agotados no aparecen en los resultados. Solo se muestran productos disponibles.

### ¿El sistema funciona sin internet?
No, requiere conexión a internet porque consulta la base de datos central.

### ¿Cuánto tarda en cargar los resultados?
Menos de 2 segundos en condiciones normales.

### ¿Se puede usar desde el celular?
Sí, la interfaz es responsive y se adapta a cualquier pantalla.

### ¿Hay límite de cotizaciones por día?
No hay límite.

---

## Resumen ejecutivo

**Este sistema permite:**
- ✅ Cotizar lentes rápidamente ingresando solo la receta y tipo de marco
- ✅ Ver todos los productos disponibles ordenados por precio
- ✅ Aplicar filtros opcionales para refinar la búsqueda
- ✅ Obtener información completa: precio, características, tiempo de entrega
- ✅ Evitar errores al consultar manualmente tablas de precios
- ✅ Brindar un servicio más profesional y rápido al cliente

**El sistema NO hace:**
- ❌ Modificar inventario
- ❌ Generar órdenes de compra
- ❌ Calcular precios dinámicamente (usa precios fijos de las tablas)
- ❌ Reemplazar el sistema de ventas actual

---

**¿Es esto lo que necesitas?**

Por favor, revisa este documento y confirma si:
1. ✅ El flujo de trabajo es correcto
2. ✅ La información mostrada es la que necesitas
3. ✅ Los ejemplos reflejan casos reales de tu negocio
4. ✅ Hay algo que falta o que debería funcionar diferente

**Próximo paso:**
Una vez que confirmes que este es el sistema que necesitas, procederemos con la implementación técnica siguiendo la especificación detallada en `historia_de_usuario_api_cotizacion_lentes.md`.
