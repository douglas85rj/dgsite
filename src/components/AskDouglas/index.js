import React, { useMemo, useState } from 'react';
import profileData from '@site/src/data/profile.json';
import styles from './index.module.css';

const COPY = {
  en: {
    assistant: 'Ask Douglas',
    greeting: 'Hi! I can tell you about Douglas\' experience, skills, certifications, and projects.',
    placeholder: 'Ask about Douglas...',
    open: 'Open Ask Douglas',
    close: 'Close Ask Douglas',
    send: 'Send message',
    suggestions: ['Experience', 'Technical skills', 'Certifications', 'Site infrastructure'],
    unavailable: 'I can answer questions about Douglas\' professional profile, technology stack, certifications, and this portfolio. Try one of the suggestions below.',
    experience: 'Douglas has experience across infrastructure, DevOps, cloud, software development, and IT operations:',
    skills: 'Douglas works with technologies including AWS, Kubernetes, Terraform, Docker, GitOps, ArgoCD, Helm, Linux, Java, React, Node.js, SQL, and monitoring tools.',
    certifications: 'Douglas holds AWS Cloud Practitioner, GitHub Foundations, and Microsoft Certified: Azure Fundamentals certifications.',
    infrastructure: 'This portfolio is a Docusaurus site built with React, containerized with Docker, and documented with an infrastructure guide. Its deployment uses CI/CD and GitOps practices.',
    contact: 'You can contact Douglas through LinkedIn or the email listed in the profile.',
  },
  es: {
    assistant: 'Ask Douglas',
    greeting: '¡Hola! Puedo contarte sobre la experiencia, habilidades, certificaciones y proyectos de Douglas.',
    placeholder: 'Pregunta sobre Douglas...',
    open: 'Abrir Ask Douglas',
    close: 'Cerrar Ask Douglas',
    send: 'Enviar mensaje',
    suggestions: ['Experiencia', 'Habilidades técnicas', 'Certificaciones', 'Infraestructura del sitio'],
    unavailable: 'Puedo responder preguntas sobre el perfil profesional, la tecnología, las certificaciones y este portfolio de Douglas. Prueba una de las sugerencias.',
    experience: 'Douglas tiene experiencia en infraestructura, DevOps, cloud, desarrollo de software y operaciones de TI:',
    skills: 'Douglas trabaja con tecnologías como AWS, Kubernetes, Terraform, Docker, GitOps, ArgoCD, Helm, Linux, Java, React, Node.js, SQL y herramientas de monitorización.',
    certifications: 'Douglas tiene las certificaciones AWS Cloud Practitioner, GitHub Foundations y Microsoft Certified: Azure Fundamentals.',
    infrastructure: 'Este portfolio es un sitio Docusaurus construido con React, contenerizado con Docker y documentado con una guía de infraestructura. El despliegue utiliza prácticas de CI/CD y GitOps.',
    contact: 'Puedes contactar con Douglas a través de LinkedIn o del correo electrónico indicado en el perfil.',
  },
  'pt-BR': {
    assistant: 'Ask Douglas',
    greeting: 'Olá! Posso contar sobre a experiência, as habilidades, as certificações e os projetos do Douglas.',
    placeholder: 'Pergunte sobre o Douglas...',
    open: 'Abrir Ask Douglas',
    close: 'Fechar Ask Douglas',
    send: 'Enviar mensagem',
    suggestions: ['Experiência', 'Habilidades técnicas', 'Certificações', 'Infraestrutura do site'],
    unavailable: 'Posso responder perguntas sobre o perfil profissional, a stack tecnológica, as certificações e este portfólio. Tente uma das sugestões abaixo.',
    experience: 'Douglas tem experiência em infraestrutura, DevOps, cloud, desenvolvimento de software e operações de TI:',
    skills: 'Douglas trabalha com AWS, Kubernetes, Terraform, Docker, GitOps, ArgoCD, Helm, Linux, Java, React, Node.js, SQL e ferramentas de monitoramento.',
    certifications: 'Douglas possui as certificações AWS Cloud Practitioner, GitHub Foundations e Microsoft Certified: Azure Fundamentals.',
    infrastructure: 'Este portfólio é um site Docusaurus construído com React, conteinerizado com Docker e documentado com um guia de infraestrutura. A implantação utiliza práticas de CI/CD e GitOps.',
    contact: 'Você pode entrar em contato com Douglas pelo LinkedIn ou pelo e-mail indicado no perfil.',
  },
};

function getResponse(question, locale, copy) {
  const normalized = question.toLowerCase();
  const experiences = profileData.experiences
    .filter((experience) => experience.type === 'work')
    .map((experience) => `${experience.title} — ${experience.subtitle} (${experience.date})`)
    .join('\n');

  if (/experience|experienc|experiencia|experiên|career|trabaj|trabalh|histórico|historial/.test(normalized)) {
    return `${copy.experience}\n${experiences}`;
  }
  if (/skill|stack|technology|technolog|habilidad|tecnolog|conocim|habilidade/.test(normalized)) {
    return copy.skills;
  }
  if (/certif|badge|credencial/.test(normalized)) {
    return copy.certifications;
  }
  if (/infrastructure|arquitect|site|website|hosting|infraestructura|infraestrutura|sitio|web/.test(normalized)) {
    return copy.infrastructure;
  }
  if (/contact|linkedin|email|mail|contato|contacto/.test(normalized)) {
    return copy.contact;
  }
  return copy.unavailable;
}

function Message({ message }) {
  return (
    <div className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.botMessage}`}>
      {message.text.split('\n').map((line, index) => (
        <React.Fragment key={`${line}-${index}`}>
          {index > 0 && <br />}
          {line}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function AskDouglas({ locale = 'en' }) {
  const copy = COPY[locale] || COPY.en;
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const suggestions = useMemo(() => copy.suggestions, [copy]);

  function ask(text) {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    setMessages((current) => [
      ...current,
      { role: 'user', text: trimmedText },
      { role: 'assistant', text: getResponse(trimmedText, locale, copy) },
    ]);
    setQuestion('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    ask(question);
  }

  return (
    <div className={styles.widget}>
      {isOpen && (
        <section className={styles.panel} aria-label={copy.assistant}>
          <header className={styles.panelHeader}>
            <div>
              <span className={styles.statusDot} aria-hidden="true" />
              <strong>{copy.assistant}</strong>
              <small>Profile assistant</small>
            </div>
            <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label={copy.close}>
              ×
            </button>
          </header>
          <div className={styles.messages} aria-live="polite">
            <Message message={{ role: 'assistant', text: copy.greeting }} />
            {messages.map((message, index) => <Message key={index} message={message} />)}
          </div>
          <div className={styles.suggestions}>
            {suggestions.map((suggestion) => (
              <button type="button" key={suggestion} onClick={() => ask(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
          <form className={styles.inputRow} onSubmit={handleSubmit}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={copy.placeholder}
              aria-label={copy.placeholder}
            />
            <button type="submit" aria-label={copy.send}>→</button>
          </form>
        </section>
      )}
      <button type="button" className={styles.launcher} onClick={() => setIsOpen((open) => !open)} aria-label={isOpen ? copy.close : copy.open}>
        <span className={styles.launcherIcon} aria-hidden="true">✦</span>
        <span>{copy.assistant}</span>
      </button>
    </div>
  );
}
