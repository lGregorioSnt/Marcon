"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchWithAuth } from '../lib/api'; // Certifique-se que o caminho está correto
import { 
  Container, Box, Typography, Paper, TextField, Button, 
  Avatar, Alert, Snackbar, Backdrop, CircularProgress, Fade,
  InputAdornment, List, ListItem, ListItemText, IconButton, Divider, Autocomplete
} from '@mui/material';
import EngineeringIcon from '@mui/icons-material/Engineering';
import BuildIcon from '@mui/icons-material/Build';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

function EntregaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Estados do formulário e dados
  const codigoInicial = searchParams.get('codigo') || '';
  const [ferramentas, setFerramentas] = useState<any[]>([]);
  const [todosColaboradores, setTodosColaboradores] = useState<any[]>([]);
  const [todasFerramentas, setTodasFerramentas] = useState<any[]>([]);
  const [novoCodigo, setNovoCodigo] = useState('');
  const [cracha, setCracha] = useState('');
  const [loading, setLoading] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState({ open: false, message: '' });

  const marconBlue = "#00509d";
  const darkGray = "#1A1C1E";

  useEffect(() => {
    const loadInitialAndAll = async () => {
      // Busca a lista de todas as ferramentas disponíveis para o Autocomplete funcionar
      try {
        const [allToolsData, allColabData] = await Promise.all([
          fetchWithAuth('http://localhost:4000/api/ferramentas'),
          fetchWithAuth('http://localhost:4000/api/colaboradores')
        ]);

        if (Array.isArray(allToolsData)) {
          setTodasFerramentas(allToolsData.filter(f => f.estoque_disponivel > 0));
        }
        if (Array.isArray(allColabData)) {
          setTodosColaboradores(allColabData);
        }
      } catch (err) {
        console.error('Erro ao carregar listas iniciais', err);
      }

      if (codigoInicial) {
        try {
          const data = await fetchWithAuth(`http://localhost:4000/api/ferramentas/${codigoInicial}`);
          if (data.estoque_disponivel === 0) {
             setErro({ open: true, message: `A ferramenta ${data.descricao} já está em uso ou indisponível.` });
          } else {
             setFerramentas([data]);
          }
        } catch (err: any) {
          setErro({ open: true, message: 'Falha ao carregar a ferramenta inicial.' });
        }
      }
      setLoading(false);
    };
    loadInitialAndAll();
  }, [codigoInicial]);

  const handleAddFromAutocomplete = (event: any, newValue: any) => {
    if (!newValue) return;
    if (typeof newValue === 'string') {
      processarInclusaoPorCodigo(newValue);
    } else {
      processarInclusaoObjeto(newValue);
    }
  };

  const processarInclusaoObjeto = (ferramenta: any) => {
    if (ferramentas.find(f => f.codigo === ferramenta.codigo)) {
      setErro({ open: true, message: 'Esta ferramenta já está na lista.' });
      setNovoCodigo('');
      return;
    }
    setFerramentas(prev => [...prev, ferramenta]);
    setNovoCodigo('');
  };

  const processarInclusaoPorCodigo = async (codigoBusca: string) => {
    if (!codigoBusca.trim()) return;
    const codigoFormatado = codigoBusca.trim().toUpperCase();

    if (ferramentas.find(f => f.codigo === codigoFormatado)) {
      setErro({ open: true, message: 'Esta ferramenta já está na lista.' });
      setNovoCodigo('');
      return;
    }

    // Tenta achar na lista em memória (mais rápido, apoia o bip do leitor)
    const found = todasFerramentas.find(f => f.codigo.toUpperCase() === codigoFormatado);
    if (found) {
      processarInclusaoObjeto(found);
      return;
    }

    // Se não achar, busca na API (pode ser recém cadastrada)
    setBuscando(true);
    try {
      const data = await fetchWithAuth(`http://localhost:4000/api/ferramentas/${codigoFormatado}`);
      if (data.estoque_disponivel === 0) {
         setErro({ open: true, message: `A ferramenta ${data.descricao} já está em uso ou indisponível.` });
      } else {
         processarInclusaoObjeto(data);
      }
    } catch (err: any) {
      setErro({ open: true, message: `Ferramenta ${codigoFormatado} não encontrada.` });
    } finally {
      setBuscando(false);
      setNovoCodigo('');
    }
  };

  const removerFerramenta = (codigoToRemove: string) => {
    setFerramentas(prev => prev.filter(f => f.codigo !== codigoToRemove));
  };

  // 2. Função que dispara a entrega para o Back-end
  const handleConfirmar = async () => {
    if (ferramentas.length === 0) {
      setErro({ open: true, message: 'Adicione pelo menos uma ferramenta para entrega.' });
      return;
    }
    if (!cracha.trim()) {
      setErro({ open: true, message: 'Por favor, informe o crachá do colaborador.' });
      return;
    }

    // Extrai o ID do usuário (Lendo do LocalStorage e Token)
    let userId = 1;
    try {
      const userStr = localStorage.getItem('marcon_user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const idFromStorage = userObj?.id || userObj?.user?.id || userObj?.usuario_id;

      let idFromToken = null;
      const token = localStorage.getItem('marcon_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        idFromToken = payload?.id || payload?.userId || payload?.usuario_id || payload?.user?.id;
      }

      userId = Number(idFromStorage || idFromToken) || 1;
    } catch (e) {
      console.warn("Aviso: Não foi possível extrair o ID do usuário.");
    }

    setEnviando(true);
    try {
      await fetchWithAuth('http://localhost:4000/api/movimentacoes/entrega', {
        method: 'POST',
        body: JSON.stringify({
          ferramentas: ferramentas.map(f => f.codigo),
          colaborador_cracha: cracha.trim(),
          almoxarife_id: userId,
          almoxarife_retirada_id: userId
        })
      });

      setSucesso(true);
      
      // 🚀 Redireciona para a Dashboard após um breve delay para o usuário ver o sucesso
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (err: any) {
      if (err.message?.includes('fk_mov_almoxarife')) {
        setErro({ open: true, message: "Sessão inválida: Seu usuário não foi encontrado no banco. Faça logout e login novamente para sincronizar." });
      } else {
        setErro({ open: true, message: err.message || "Falha ao registrar entrega." });
      }
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: marconBlue }} size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 6, pb: 8 }}>
      
      {/* Botão de Voltar */}
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => router.push('/')}
        sx={{ color: '#64748B', mb: 3, textTransform: 'none', fontWeight: 700 }}
      >
        Cancelar e voltar ao painel
      </Button>

      <Fade in={true} timeout={600}>
        <Paper elevation={0} sx={{ 
          p: 5, borderRadius: 6, 
          border: '1px solid #E2E8F0',
          boxShadow: '0px 25px 50px -12px rgba(0,0,0,0.08)',
          position: 'relative', overflow: 'hidden',
          bgcolor: 'white'
        }}>
          {/* Detalhe estético no topo */}
          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', bgcolor: marconBlue }} />
          
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar sx={{ 
              bgcolor: `${marconBlue}10`, color: marconBlue, 
              width: 70, height: 70, mx: 'auto', mb: 2 
            }}>
              <EngineeringIcon sx={{ fontSize: 35 }} />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 900, color: darkGray, letterSpacing: '-1px' }}>
              Liberação de Ativo
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Confirme os dados abaixo para registrar a saída.
            </Typography>
          </Box>

          {/* Adicionar Ferramentas */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: darkGray, mb: 1 }}>
              Adicionar Ativos à Entrega
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Autocomplete
                fullWidth
                freeSolo
                options={todasFerramentas}
                getOptionLabel={(option: any) => typeof option === 'string' ? option : `${option.codigo} - ${option.descricao}`}
                value={null}
                inputValue={novoCodigo}
                onInputChange={(e, newInputValue) => setNovoCodigo(newInputValue || '')}
                onChange={handleAddFromAutocomplete}
                disabled={buscando}
                renderInput={(params: any) => {
                  const { InputProps, ...restParams } = params;
                  return (
                    <TextField
                      {...restParams}
                      placeholder="Busque por nome, marca ou bipe o código..."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#FDFDFD' } }}
                      slotProps={{
                        input: {
                          ...InputProps,
                          startAdornment: (
                            <InputAdornment position="start" sx={{ pl: 1 }}>
                              <BuildIcon sx={{ color: '#CBD5E1' }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  );
                }}
              />
              <Button 
                variant="contained" 
                onClick={() => processarInclusaoPorCodigo(novoCodigo)}
                disabled={buscando || !novoCodigo.trim()}
                sx={{ borderRadius: 3, bgcolor: darkGray, '&:hover': { bgcolor: '#000' }, minWidth: 60 }}
              >
                {buscando ? <CircularProgress size={24} color="inherit" /> : <AddIcon />}
              </Button>
            </Box>
          </Box>

          {/* Lista de Ferramentas Selecionadas */}
          {ferramentas.length > 0 ? (
            <Box sx={{ mb: 4, border: '1px solid #E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
              <List disablePadding>
                {ferramentas.map((f, index) => (
                  <React.Fragment key={f.codigo}>
                    <ListItem 
                      secondaryAction={
                        <IconButton edge="end" onClick={() => removerFerramenta(f.codigo)} sx={{ color: '#DC2626' }}>
                          <DeleteIcon />
                        </IconButton>
                      }
                      sx={{ bgcolor: '#F8FAFC' }}
                    >
                      <Avatar variant="rounded" sx={{ bgcolor: `${marconBlue}20`, color: marconBlue, width: 40, height: 40, mr: 2 }}>
                          <BuildIcon fontSize="small" />
                      </Avatar>
                      <ListItemText 
                        primary={<Typography sx={{ fontWeight: 800, color: darkGray }}>{f.descricao}</Typography>}
                        secondary={<Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Código: {f.codigo}</Typography>}
                      />
                    </ListItem>
                    {index < ferramentas.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          ) : (
            <Box sx={{ mb: 4, p: 3, textAlign: 'center', border: '1px dashed #CBD5E1', borderRadius: 4, bgcolor: '#F8FAFC' }}>
              <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                Nenhum ativo selecionado para entrega.
              </Typography>
            </Box>
          )}

          {/* Input do Crachá */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: darkGray, mb: 1 }}>
              Crachá do Colaborador (Mecânico/Operador)
            </Typography>
            <Autocomplete
              fullWidth
              autoFocus
              freeSolo
              options={todosColaboradores}
              getOptionLabel={(option: any) => typeof option === 'string' ? option : `${option.nome} (${option.cracha})`}
              inputValue={cracha}
              onInputChange={(event, newInputValue) => {
                // Extrai apenas o número do crachá se o formato "Nome (Crachá)" for usado
                const match = newInputValue.match(/\((\d+)\)/);
                setCracha(match ? match[1] : newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Selecione, digite o nome ou bipe o crachá"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmar();
                    }
                  }}
                />
              )}
            />
          </Box>

          {/* Botão de Ação Principal */}
          <Button 
            fullWidth 
            variant="contained" 
            onClick={handleConfirmar}
            disabled={ferramentas.length === 0 || !cracha.trim() || enviando}
            startIcon={<CheckCircleIcon />}
            sx={{ 
              py: 2, borderRadius: 3, fontWeight: 900, fontSize: '1.1rem',
              bgcolor: marconBlue, textTransform: 'none',
              boxShadow: `0px 10px 20px ${marconBlue}40`,
              '&:hover': { bgcolor: '#003a70' }
            }}
          >
            {enviando ? "Processando..." : "Confirmar Entrega"}
          </Button>
        </Paper>
      </Fade>

      {/* Feedbacks de Status */}
      <Backdrop open={enviando} sx={{ zIndex: 9999, color: '#fff', backdropFilter: 'blur(4px)' }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Snackbar open={sucesso} autoHideDuration={3000}>
        <Alert severity="success" variant="filled" sx={{ width: '100%', borderRadius: 3, fontWeight: 700 }}>
          Entrega registrada! Redirecionando para o painel...
        </Alert>
      </Snackbar>

      <Snackbar open={erro.open} autoHideDuration={5000} onClose={() => setErro({ ...erro, open: false })}>
        <Alert severity="error" variant="filled" sx={{ width: '100%', borderRadius: 3 }}>
          {erro.message}
        </Alert>
      </Snackbar>

    </Container>
  );
}

// O Next.js exige que componentes que usam useSearchParams fiquem dentro de um Suspense
export default function EntregaPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>}>
      <EntregaForm />
    </Suspense>
  );
}