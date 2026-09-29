import { NavLink, useLocation } from "react-router-dom";

const nomes = {
    administrador: "Administrador",
    diretor: "Diretor",
    mobilizador: "Mobilizador",
    membro: "Membro"
};

const paginas = {
    "/dashboard": "Dashboard",
    "/agendamentos": "Agendamentos",
    "/tarefas": "Tarefas",
    "/membros": "Membros",
    "/cadastro": "Gerenciar usuários",
    "/projetos": "Gerenciar projetos"
};

function Layout({ usuario, onLogout, children }) {
    const location = useLocation();

    const podeVerMembros = [
        "administrador",
        "diretor",
        "mobilizador"
    ].includes(usuario?.nivel_acesso);

    const podeCadastrar = [
        "administrador",
        "diretor",
        "mobilizador"
    ].includes(usuario?.nivel_acesso);

    const menuPrincipal = [
        { to: "/dashboard", label: "Dashboard", icon: "▦" },
        { to: "/agendamentos", label: "Agendamentos", icon: "◷" },
        { to: "/tarefas", label: "Tarefas", icon: "✓" }
    ];

    const menuMobilizacao = [
        ...(podeVerMembros ? [{ to: "/membros", label: "Gerenciar membros", icon: "♟" }] : []),
        ...(podeCadastrar ? [{ to: "/cadastro", label: "Gerenciar usuários", icon: "+" }] : []),
        ...(podeCadastrar ? [{ to: "/projetos", label: "Gerenciar projetos", icon: "▤" }] : [])
    ];

    const tituloPagina = paginas[location.pathname] || "Sistema";

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-mark">P</div>
                    <div className="brand-text">
                        <strong>SEP</strong>
                        <span>Sistema Embaixada<br />Politize</span>
                    </div>
                </div>

                <div className="sidebar-divider" />

                <nav className="sidebar-nav">
                    {menuPrincipal.map((item) => (
                        <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
                            <span className="sidebar-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    {menuMobilizacao.length > 0 && (
                        <>
                            <div className="sidebar-section-title">ÁREA DE MOBILIZAÇÃO</div>
                            {menuMobilizacao.map((item) => (
                                <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link sidebar-link-sub ${isActive ? "active" : ""}`}>
                                    <span className="sidebar-icon">{item.icon}</span>
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </>
                    )}
                </nav>

                <div className="sidebar-bottom">
                    <div className="user-mini">
                        <div className="user-avatar">
                            {(usuario?.nome || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="user-mini-info">
                            <strong>{usuario?.nome || "Usuário"}</strong>
                            <span>{nomes[usuario?.nivel_acesso] || "Usuário"}</span>
                        </div>
                    </div>

                    <button className="sidebar-logout" onClick={onLogout}>
                        <span>↪</span>
                        Sair
                    </button>
                </div>
            </aside>

            <section className="main-area">
                <header className="topbar">
                    <div>
                        <span className="topbar-project">SEP — Sistema Embaixada Politize</span>
                        <span className="topbar-separator">/</span>
                        <span className="topbar-page">{tituloPagina}</span>
                    </div>

                    <div className="topbar-user">
                        <span>{usuario?.nome}</span>
                        <span className="topbar-role">{nomes[usuario?.nivel_acesso]}</span>
                    </div>
                </header>

                <main className="content-area">
                    {children}
                </main>
            </section>
        </div>
    );
}

export default Layout;
