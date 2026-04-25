# Comandos

balance call
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "balanceOf(address)" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --rpc-url http://1270.0.1:8545

mint send
cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 "mint(address,uint256)" "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" "5000e18" --rpc-url http://127.0.0.1:8545 --private-key 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

allowance call
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "allowance(address,address)" "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707" --rpc-url http://127.0.0.1:8545 --private-key 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d


delegate vote
cast send 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 "delegate(address)" "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" --rpc-url http://127.0.0.1:8545 --private-key 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

# Dashboard

Protocol Overview:

- Governance Layer => hay forma de ver gonernace pausado? --ok
- Treasury Layer -- ok 
- Guardian Network - ok

Recent Protocol Activity => activity mock

# Bonding

pendientes implemtar eventos de compra.

# Governance

ok todo listo, 

# Guardians

vistas generales esta bien.

# Vaults

revisar enlaces

- view details de vaults
- open vaults
- view my positions

# Treasury

revisar enlaces

- Treasury  Actions (quien son los que pueden sacar de alli? que rol es?) - necesita rol


# Treasury Operations (operations)

- revisar retiros

# Operations

- revisar flujos al ingresar datos

# Risk

- revisar flujos al ingresar datos

# Admin

- revisar flujos al ingresar datos
