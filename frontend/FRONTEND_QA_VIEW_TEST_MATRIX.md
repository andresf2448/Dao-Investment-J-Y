# Frontend QA View Test Matrix

Este documento sirve como guía manual de pruebas para validar que el frontend
está consumiendo contratos reales, respetando permisos por rol y mostrando
estados vacíos de forma consistente.

## Objetivo

- Verificar que cada vista carga sin errores.
- Confirmar que las acciones de escritura solo aparecen para los roles correctos.
- Validar que las tablas vacías, métricas y cards se comportan de forma coherente.
- Revisar que las vistas “tontas” reciban toda la lógica desde sus hooks.

## Reglas Generales

- Todas las vistas deben abrir sin romperse en `mobile`, `tablet` y `desktop`.
- Cuando no haya datos, el estado vacío debe verse centrado y claro.
- No debe existir lógica de negocio en la página si ya vive en el hook.
- Cualquier acción de escritura debe confirmar wallet y actualizar estado luego del receipt.

## Roles A Probar

### 1. Wallet Conectada Sin Rol

- Puede navegar a vistas públicas.
- No debe ver botones de operaciones restringidas.
- Debe ver CTAs de lectura o acceso cuando aplique.

### 2. Proposer / Usuario Con Threshold

- Debe poder abrir `governance/create`.
- Debe ver `canCreateProposal = true` cuando tenga voting power suficiente.
- Si no delegó votos, debe poder delegarlos.

### 3. Guardian Inactivo

- Debe ver `Apply as Guardian`.
- No debe ver operaciones guardian activas.
- Debe poder enviar la aplicación con stake suficiente.

### 4. Guardian Activo

- Debe ver `Guardian Operations`.
- Debe poder crear vaults.
- Debe poder ejecutar estrategias cuando el vault y el protocolo lo permitan.

### 5. Treasury Admin

- Debe ver `/treasury/operations`.
- Debe poder ejecutar retiros `withdrawDaoERC20(...)`.
- No debe ver flujos no expuestos por el MVP.

### 6. Manager Operator

- Debe poder pausar y reanudar `vault creation` y `vault deposits`.
- Debe poder reanudar `risk execution`.
- Debe poder acceder a la consola de `operations`.

### 7. Emergency Operator

- Debe poder pausar `vault creation`, `vault deposits` y `risk execution`.
- No debe ver botones de reanudación si no tiene rol manager.

### 8. Admin Operator

- Debe acceder a `/admin`.
- Debe ver diagnóstico real de contratos y wiring.
- Debe poder abrir `/treasury/operations` solo si también es treasury admin.

## Matriz Por Vista

### `/dashboard`

- Validar que las métricas principales se cargan desde contratos.
- Confirmar que `Recent Activity` sigue siendo placeholder si no hay indexación.
- Revisar que el CTA de `Apply as Guardian` solo aparezca para wallets elegibles.

### `/bonding`

- Confirmar que la compra de GOV funciona con approve + buy.
- Validar que el botón de compra quede deshabilitado sin balance o sin amount válido.
- Revisar que la vista muestre el estado correcto antes y después de finalizar bonding.

### `/governance`

- Verificar que `Proposal List` usa las últimas propuestas on-chain.
- Confirmar que el `Proposal ID` se ve truncado y copiable.
- Validar que el empty state quede centrado cuando no haya propuestas.
- Revisar que `Open Proposal Composer` esté disponible solo si la wallet está conectada.

### `/governance/create`

- Confirmar que la delegación de votos funciona.
- Validar que el composer permita agregar/remover acciones.
- Revisar que `Submit Proposal` solo se habilite cuando haya threshold y campos válidos.
- Verificar que el submit final todavía quede pendiente hasta conectar `propose(...)`.

### `/governance/:proposalId`

- Confirmar que el `Proposal ID` no se salga del contenedor.
- Validar que la descripción, timeline y acciones se muestren de forma consistente.
- Revisar el copy del botón `Copy ID`.
- Confirmar que los campos todavía marcados como mockados estén identificados visualmente.

### `/guardians`

- Con wallet inactiva, validar que no aparezca el CTA de aplicación.
- Con guardian inactivo, validar que sí aparezca `Submit Guardian Application`.
- Con guardian activo, validar que el estado cambie a `Bonded` o equivalente.
- Revisar que el bloque de stake requerido refleje el balance real del usuario.

### `/vaults`

- Validar que los filtros funcionan sin botón extra.
- Confirmar que `Vault Explorer`, `Guardian Routing` y `Registry Visibility` usan estado real.
- Revisar que la tabla vacía muestre estado centrado si no hay vaults filtrados.
- Con guardian activo, validar que `Guardian Vault Tools` aparezca.

### `/vaults/:vaultAddress`

- Validar que el summary, metadata y posición se leen desde contrato.
- Confirmar que los botones de deposit/mint/withdraw/redeem respetan `canDeposit`, `canMint`, `canWithdraw`, `canRedeem`.
- Revisar que `Execute Strategy` solo aparezca para guardianes con permiso.
- Confirmar que el ID largo se muestre truncado y copiable.

### `/vaults/positions`

- Confirmar que el empty state se vea centrado cuando no haya posiciones.
- Validar que cada fila enlace a su vault.
- Revisar que las métricas agregadas no muestren datos inventados.

### `/vaults/guardian-tools`

- Con guardian activo, validar que permita crear vault si el asset está soportado.
- Con guardian no activo, validar que el acceso esté restringido.
- Confirmar que el address predicho y el vault existente se actualicen correctamente.

### `/treasury`

- Validar que `Asset Allocation` muestre balances reales de `USDT`, `USDC` y native reserve cuando existan.
- Confirmar que el empty state de la tabla se centre si no hay assets.
- Revisar que la vista no muestre acciones restringidas si no hay rol.
- Confirmar que `Treasury Actions` no aparezca sin rol suficiente.

### `/treasury/operations`

- Con treasury admin, validar que el formulario permita retiros.
- Confirmar que solo `DAO Asset` habilite ejecución en este MVP.
- Verificar que el address del token pueda escribirse manualmente.
- Revisar que el botón quede deshabilitado sin amount, recipient o permiso.

### `/operations`

- Con permisos de manager/emergency/admin, validar pausas, wiring y soporte de assets.
- Confirmar que `Asset Support` y `Infrastructure Wiring` viven en el hook y no en la vista.
- Revisar que no haya botón `Apply Filters` o CTAs sin funcionalidad.
- Validar que los estados vacíos o de restricción se muestren con copy claro.

### `/risk`

- Con manager/emergency, validar pausa y reanudación de ejecución.
- Confirmar que `Asset Health` muestre solo assets conocidos localmente con config on-chain.
- Revisar que el callout de `Data Source` se vea cuando la tabla esté vacía.
- Validar que `Asset Configuration` escriba `setAssetConfig(...)`.

### `/admin`

- Con admin operator, validar que la vista cargue contratos, métricas y diagnósticos reales.
- Confirmar que el bloque de permisos refleje capacidades reales.
- Revisar que no existan contratos mockeados.
- Validar que la vista se mantenga útil aun cuando la red no tenga todas las direcciones.

## Estados Vacíos Que Deben Verse Centrados

- `risk` -> `No configured assets available`
- `treasury` -> `No treasury assets available`
- `governance` -> `No proposals available`
- `vaults` -> `No registered vaults available`
- `vaults/positions` -> `No vault positions available`

## Criterios de Aceptación

- La navegación principal abre sin errores.
- Cada vista protege sus acciones por rol.
- Los empty states se ven centrados y consistentes.
- Los datos on-chain reemplazan a los mockeados donde ya existe soporte.
- Las vistas complejas siguen el patrón: hook con lógica, página visual.

## Nota Técnica

- El proyecto aún depende de un error externo del SDK generado en `@dao/contracts-sdk/src/addresses/index.ts` para una validación completa con TypeScript/build.
- Este documento asume que las pruebas se hacen contra la red/local chain configurada para el frontend.
