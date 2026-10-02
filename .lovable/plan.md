# Remover a galeria de imagens abaixo de “Últimas Notícias”

## Alterações
- Remover a galeria animada de imagens circulares da página inicial, fazendo “Últimas Notícias” seguir diretamente para a faixa de contato.
- Excluir o componente exclusivo dessa galeria e retirar sua importação e uso na página inicial.
- Limpar somente dependências exclusivas da seção.

## Cuidados
- Manter a imagem `criancas-culto-ide`, pois ela também é usada na seção “Sobre Nós”.
- Manter a biblioteca de animações, pois várias outras áreas do site dependem dela.
- Nenhum CSS global precisa ser removido: a galeria usa apenas estilos aplicados diretamente no próprio componente.

## Verificação
- Confirmar que a página inicial abre sem espaço vazio ou rolagem horizontal entre “Últimas Notícias” e a faixa de contato.
- Confirmar que a imagem da seção “Sobre Nós” permanece funcionando.
- Validar a versão para computador e celular e conferir que não há erros no site.
