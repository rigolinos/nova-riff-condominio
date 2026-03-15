#!/bin/bash

# Script para aplicar migrations do Supabase
# Execute: chmod +x apply-migrations.sh && ./apply-migrations.sh

set -e

echo "🗄️  Script de Aplicação de Migrations - Riff2"
echo "=============================================="
echo ""

# Verificar se está no diretório correto
if [ ! -d "supabase/migrations" ]; then
    echo "❌ Erro: Diretório supabase/migrations não encontrado!"
    echo "Por favor, execute este script na raiz do projeto."
    exit 1
fi

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "📦 Supabase CLI não encontrado. Instalando..."
    npm install -g supabase
fi

echo "✅ Supabase CLI encontrado"
echo ""

# Verificar status da conexão
echo "🔍 Verificando conexão com Supabase..."
echo ""

# Listar migrations pendentes
echo "📋 Migrations disponíveis:"
ls -1 supabase/migrations/2025100422*.sql 2>/dev/null || echo "Nenhuma migration nova encontrada"
echo ""

# Perguntar se deseja continuar
read -p "Deseja aplicar as migrations? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operação cancelada pelo usuário"
    exit 0
fi

# Aplicar migrations
echo ""
echo "🚀 Aplicando migrations..."
echo ""

npx supabase db push

echo ""
echo "✅ Migrations aplicadas com sucesso!"
echo ""

# Verificar se a função foi criada
echo "🔍 Verificando se a função auto_finalize_events foi criada..."
echo ""

npx supabase db execute <<SQL
SELECT 
    proname as function_name,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'auto_finalize_events';
SQL

echo ""
echo "✅ Processo concluído!"
echo ""
echo "📝 Próximos passos:"
echo "1. Verifique o arquivo MIGRATION_INSTRUCTIONS.md para configurar o cron job"
echo "2. Teste a função manualmente: SELECT public.auto_finalize_events();"
echo "3. Monitore os logs no Supabase Dashboard"
echo ""


