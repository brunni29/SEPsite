function permitir(...niveisPermitidos) {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                mensagem: "Usuário não autenticado."
            });
        }

        if (!niveisPermitidos.includes(req.usuario.nivel_acesso)) {
            return res.status(403).json({
                mensagem: "Você não possui permissão para acessar este recurso."
            });
        }

        next();
    };
}

module.exports = permitir;
