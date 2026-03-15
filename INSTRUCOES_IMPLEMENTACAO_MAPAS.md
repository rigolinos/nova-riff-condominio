# 🗺️ INSTRUÇÕES: Implementação de Mapas Interativos

> **Status:** ✅ Save point criado - Pronto para começar  
> **Data:** 09 de outubro de 2025

---

## 💾 **SAVE POINT CRIADO COM SUCESSO!**

✅ **Tag:** `v1.1-pre-maps-implementation`  
✅ **Branch de backup:** `backup/pre-maps-implementation-v2`  
✅ **Push realizado:** Tudo salvo no GitHub

**Como reverter se necessário:**
```bash
git checkout v1.1-pre-maps-implementation
# ou
git checkout backup/pre-maps-implementation-v2
```

---

## 🎯 **O QUE VOCÊ PRECISA FAZER AGORA**

### **PASSO 1: Criar Google Maps API Key** 🔑

#### 1.1 Acessar Google Cloud Console
1. Vá para: https://console.cloud.google.com
2. Faça login com sua conta Google
3. Crie um novo projeto OU selecione um existente
   - Nome sugerido: "Riff Maps"

#### 1.2 Habilitar as 3 APIs Necessárias

**API 1: Maps JavaScript API**
- Link direto: https://console.cloud.google.com/apis/library/maps-backend.googleapis.com
- Clique em **"ENABLE"** (Ativar)

**API 2: Places API**
- Link direto: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
- Clique em **"ENABLE"** (Ativar)

**API 3: Geocoding API**
- Link direto: https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com
- Clique em **"ENABLE"** (Ativar)

#### 1.3 Criar API Key

1. Vá em: https://console.cloud.google.com/apis/credentials
2. Clique em **"+ CREATE CREDENTIALS"**
3. Selecione **"API key"**
4. **IMPORTANTE:** Copie e guarde a chave gerada

#### 1.4 Configurar Restrições de Segurança (CRÍTICO!)

1. Na tela de credentials, clique na API Key que você criou
2. Clique em **"Edit API key"** (ícone de lápis)

**Application restrictions:**
- Selecione: **"HTTP referrers (web sites)"**
- Adicione estes referrers:
  ```
  http://localhost:*
  http://127.0.0.1:*
  https://seudominio.com/*
  ```

**API restrictions:**
- Selecione: **"Restrict key"**
- Marque apenas estas 3 APIs:
  - ☑ Maps JavaScript API
  - ☑ Places API
  - ☑ Geocoding API

3. Clique em **"SAVE"**

---

### **PASSO 2: Configurar Variáveis de Ambiente** ⚙️

#### 2.1 Abrir arquivo `.env`

Navegue até: `figma-pixel-perfect-clone-3447/.env`

#### 2.2 Adicionar Configurações de Mapas

Adicione estas linhas no final do arquivo `.env`:

```env
# Google Maps API Configuration
VITE_GOOGLE_MAPS_API_KEY=cole_sua_chave_aqui

# Map Default Settings
VITE_MAP_DEFAULT_CENTER_LAT=-23.5505
VITE_MAP_DEFAULT_CENTER_LNG=-46.6333
VITE_MAP_DEFAULT_ZOOM=12
VITE_MAP_DEFAULT_RADIUS_KM=10
```

**⚠️ IMPORTANTE:** Substitua `cole_sua_chave_aqui` pela API Key que você copiou!

---

### **PASSO 3: Responder Configurações de Preferência** 📝

Por favor, me responda estas perguntas para eu configurar corretamente:

#### **3.1 Centro do Mapa Padrão**
Quando o mapa abrir pela primeira vez, onde ele deve estar centralizado?

**Opções:**
- [ ] São Paulo (cidade) → Deixar como está (`-23.5505, -46.6333`)
- [ ] Rio de Janeiro → Mudar para (`-22.9068, -43.1729`)
- [ ] Brasil inteiro (centro) → Mudar para (`-14.2350, -51.9253`)
- [ ] Outra cidade → Me diga qual: ___________

#### **3.2 Raio de Busca "Eventos Perto de Mim"**
Qual distância considerar como "perto"?

**Opções:**
- [ ] 5 km (bairros próximos)
- [ ] **10 km (RECOMENDADO)** - equilíbrio
- [ ] 20 km (cidade inteira)
- [ ] 50 km (região metropolitana)

#### **3.3 Estilo do Mapa**
Qual visual você prefere?

**Opções:**
- [ ] Padrão Google (colorido, familiar)
- [ ] **Night Mode (RECOMENDADO)** - combina com design escuro
- [ ] Custom (cores da marca Riff - amarelo/azul)

#### **3.4 Posicionamento do Mapa**
Onde colocar o mapa na aplicação?

**Opções:**
- [ ] Nova página dedicada `/events/map`
- [ ] **Tab na página `/events` (RECOMENDADO)** - toggle Lista/Mapa
- [ ] Modal/popup acionado por botão
- [ ] Seção na dashboard

#### **3.5 Geolocalização do Usuário**
Pedir permissão para acessar localização?

**Opções:**
- [ ] **Opcional (RECOMENDADO)** - só pede ao clicar "Perto de Mim"
- [ ] Sempre pedir ao abrir mapa
- [ ] Não usar geolocalização

---

## 📋 **TEMPLATE DE RESPOSTA**

Para facilitar, copie e cole este template preenchido:

```
🗺️ CONFIGURAÇÕES DE MAPAS

API Key:
VITE_GOOGLE_MAPS_API_KEY=AIzaSy... (cole aqui)

Configurações:
1. Centro do mapa: [Sua escolha: SP / RJ / Brasil / Outro]
2. Raio padrão: [5km / 10km / 20km / 50km]
3. Estilo: [Padrão / Night Mode / Custom]
4. Posicionamento: [Nova página / Tab / Modal]
5. Geolocalização: [Opcional / Sempre / Não usar]
```

---

## 🚀 **DEPOIS QUE VOCÊ RESPONDER**

Assim que você me enviar:
1. ✅ A API Key
2. ✅ Suas preferências de configuração

Eu vou:
1. 🔧 Configurar as variáveis de ambiente
2. 📦 Instalar as bibliotecas NPM necessárias
3. 🗄️ Criar migration para adicionar lat/lng no banco
4. 🎨 Implementar o autocomplete de lugares
5. 🗺️ Implementar o mapa interativo
6. 🎯 Implementar os filtros e "Perto de Mim"

---

## 📊 **FASES DE IMPLEMENTAÇÃO**

Vou implementar em **3 fases principais**:

### **FASE 1: Infraestrutura (30 min)**
- Configurar variáveis de ambiente
- Instalar bibliotecas (`@react-google-maps/api`)
- Criar migration SQL (adicionar latitude/longitude na tabela events)
- Atualizar TypeScript types

### **FASE 2: Autocomplete de Lugares (1-2 horas)**
- Criar componente `GooglePlacesAutocomplete`
- Integrar no `CreateEventStep2` (campo "Local")
- Salvar coordenadas automaticamente
- Validação e testes

### **FASE 3: Mapa Interativo (2-3 horas)**
- Criar componente `EventsMap`
- Renderizar pins dos eventos
- Popup com informações ao clicar
- Filtros e "Perto de Mim"
- Navegação para evento

---

## ⏱️ **TEMPO ESTIMADO TOTAL**

- **Melhor cenário:** 3-4 horas
- **Realista:** 4-6 horas
- **Com ajustes e testes:** 6-8 horas

---

## 💰 **CUSTOS ESTIMADOS**

### **Com seu volume esperado (MVP):**
- **Custo mensal:** $0 (dentro do free tier)
- **Limite grátis:** 
  - 28.500 map loads/mês
  - 1.000 autocompletes/mês
  - 40.000 geocoding requests/mês

### **Se crescer muito:**
- Com 1.000 usuários/mês: ~$22/mês
- Com 10.000 usuários/mês: ~$200/mês

**Mas para começar:** 100% GRÁTIS ✅

---

## 🔒 **SEGURANÇA**

✅ API Key configurada com restrições  
✅ Apenas domínios autorizados podem usar  
✅ Apenas 3 APIs específicas habilitadas  
✅ Variável de ambiente (não vai para o Git)  

**IMPORTANTE:** Nunca commite a API Key no código!

---

## ❓ **DÚVIDAS FREQUENTES**

**P: E se eu não tiver cartão de crédito para o Google Cloud?**
R: O free tier não exige cartão para começar, mas pode ser solicitado para validação. Alternativa: usar OpenStreetMap (100% grátis sempre).

**P: Posso mudar as configurações depois?**
R: Sim! Todas as configurações são variáveis de ambiente, fácil de mudar.

**P: E se algo der errado?**
R: Temos o save point! Basta reverter: `git checkout v1.1-pre-maps-implementation`

**P: Preciso saber React/TypeScript avançado?**
R: Não! Eu vou implementar tudo. Você só precisa fornecer a API Key e preferências.

---

## 📞 **PRÓXIMO PASSO**

**👉 Me envie o template preenchido com sua API Key e preferências!**

Assim que receber, começamos a implementação imediatamente! 🚀

---

**Documento criado em:** 09 de outubro de 2025  
**Status:** ⏳ Aguardando API Key e configurações do usuário

