const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
    const cabecalho = req.headers.authorization;

    if (!cabecalho) {
        return res.status(401).json({
            mensagem: "Token não informado."
        });
    }

    const partes = cabecalho.split(" ");

    if (partes.length !== 2 || partes[0] !== "Bearer") {
        return res.status(401).json({
            mensagem: "Formato do token inválido."
        });
    }

    try {
        const dados = jwt.verify(partes[1], process.env.JWT_SECRET);
        req.usuario = dados;
        next();
    } catch (erro) {
        return res.status(401).json({
            mensagem: "Token inválido ou expirado."
        });
    }
}

module.exports = autenticar;
