import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { 
  Headphones, 
  MessageCircle, 
  Book, 
  FileQuestion, 
  Mail, 
  Phone,
  ChevronRight,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { reportsService } from '../api/services';

export const HelpCenter = () => {
  const { t } = useTranslation();
  const [chatInput, setChatInput] = React.useState('');
  const [chatMessages, setChatMessages] = React.useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [docsOpen, setDocsOpen] = React.useState(false);
  const chatAreaRef = React.useRef<HTMLDivElement | null>(null);
  const docsAreaRef = React.useRef<HTMLDivElement | null>(null);

  const helpMutation = useMutation({
    mutationFn: (message: string) => reportsService.askHelpAssistant(message),
    onSuccess: (data) => {
      setChatMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
    },
    onError: () => {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: t('help.ai_error', 'Could not get AI support response. Please try again.') },
      ]);
    },
  });

  const handleSend = () => {
    const message = chatInput.trim();
    if (!message || helpMutation.isPending) return;
    setChatOpen(true);
    setChatMessages((prev) => [...prev, { role: 'user', text: message }]);
    setChatInput('');
    helpMutation.mutate(message);
  };

  const handleStartConversation = () => {
    setChatOpen(true);
    chatAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleViewDocs = () => {
    setDocsOpen(true);
    docsAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const faqs = [
    {
      q: t('help.faq1_q', "How do I create a new journal entry?"),
      a: t('help.faq1_a', "Navigate to the Journal Entries page from the sidebar and click the 'New Entry' button in the top right. Fill out the debits and credits ensuring they balance.")
    },
    {
      q: t('help.faq2_q', "How do I add a new account to the Chart of Accounts?"),
      a: t('help.faq2_a', "Go to the Chart of Accounts page and click 'New Account'. You'll need to specify an Account Code, Name, and its Type (Asset, Liability, Equity, Revenue, Expense).")
    },
    {
      q: t('help.faq3_q', "Can I export my financial reports?"),
      a: t('help.faq3_a', "Yes, on any report page (Trial Balance, Income Statement, Balance Sheet), use the 'Print' or 'Export' button at the top right to generate a PDF or Excel file.")
    },
    {
      q: t('help.faq4_q', "Is my financial data secure?"),
      a: t('help.faq4_a', "Absolutely. We use industry-standard encryption and JWT authentication to ensure your business data is only accessible to authorized users.")
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-page-enter">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200 p-5 sm:p-8 lg:p-12 shadow-sm">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Headphones className="w-64 h-64 text-primary" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {t('help.support_center', 'Support Center')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {t('help.title', 'How can we help you?')}
          </h1>
          <p className="text-gray-500 text-lg">
            {t('help.subtitle', "Find answers to common questions or reach out to our team directly. We're here to make your accounting experience seamless.")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Contact Options */}
        <div className="space-y-6">
          <Card className="hover:border-primary/30 transition-colors border-2 border-transparent">
            <CardBody className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('help.live_chat', 'Live Chat')}</h3>
              <p className="text-sm text-gray-500 mb-4">{t('help.live_chat_desc', 'Describe your system issue and get an instant troubleshooting guide from AI support.')}</p>

              {!chatOpen ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 h-36 overflow-y-auto mb-3 space-y-2">
                  <p className="text-xs text-gray-500">
                    {t('help.ai_hint', 'AI support handles system issues only: login, reports, export, settings, permissions, errors.')}
                  </p>
                </div>
              ) : (
                <div ref={chatAreaRef} className="rounded-xl border border-gray-200 bg-gray-50 p-3 h-56 overflow-y-auto mb-3 space-y-2">
                  {chatMessages.length === 0 && (
                    <p className="text-xs text-gray-500">
                      {t('help.ai_hint', 'AI support handles system issues only: login, reports, export, settings, permissions, errors.')}
                    </p>
                  )}

                  {chatMessages.map((msg, idx) => (
                    <div
                      key={`${msg.role}-${idx}`}
                      className={`text-xs px-2.5 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-white border border-gray-200 text-gray-700'}`}
                    >
                      {msg.text}
                    </div>
                  ))}

                  {helpMutation.isPending && (
                    <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-2.5 py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {t('help.ai_thinking', 'AI is analyzing your issue...')}
                    </div>
                  )}
                </div>
              )}

              {chatOpen && (
                <>
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    rows={2}
                    placeholder={t('help.ai_placeholder', 'Write your system problem...')}
                    className="input-base w-full text-sm mb-3 resize-none"
                  />

                  <button
                    onClick={handleSend}
                    disabled={!chatInput.trim() || helpMutation.isPending}
                    className="text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed font-semibold text-sm inline-flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    {t('help.start_convo', 'Start a conversation')} <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {!chatOpen && (
                <button
                  onClick={handleStartConversation}
                  className="text-blue-600 font-semibold text-sm inline-flex items-center gap-1 hover:gap-2 transition-all"
                >
                  {t('help.start_convo', 'Start a conversation')} <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </CardBody>
          </Card>

          <Card className="hover:border-primary/30 transition-colors border-2 border-transparent">
            <CardBody className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('help.email_support', 'Email Support')}</h3>
              <p className="text-sm text-gray-500 mb-4">{t('help.email_support_desc', 'Prefer to email? Send us your queries and we\'ll get back to you within 24 hours.')}</p>
              <a href="mailto:support@techmart.uz" className="text-purple-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                support@techmart.uz <ExternalLink className="w-4 h-4" />
              </a>
            </CardBody>
          </Card>
          
          <Card className="hover:border-primary/30 transition-colors border-2 border-transparent">
            <CardBody className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('help.phone_support', 'Phone Support')}</h3>
              <p className="text-sm text-gray-500 mb-4">{t('help.phone_support_desc', 'Call us directly for urgent matters during business hours (9AM - 6PM UZT).')}</p>
              <a href="tel:+998901234567" className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                +998 90 123 45 67 <ExternalLink className="w-4 h-4" />
              </a>
            </CardBody>
          </Card>
        </div>

        {/* FAQs */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gray-100">
              <FileQuestion className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-xl font-bold">{t('help.faq_title', 'Frequently Asked Questions')}</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <Card key={i} className="group hover:shadow-md transition-shadow">
                <CardBody className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary transition-colors mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {faq.a}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Documentation Promo */}
          <div className="mt-8 p-6 rounded-2xl border border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                <Book className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{t('help.docs_title', 'Read the Documentation')}</h4>
                <p className="text-sm text-gray-500">{t('help.docs_desc', 'Comprehensive guides and API references.')}</p>
              </div>
            </div>
            <button onClick={handleViewDocs} className="btn-secondary whitespace-nowrap w-full sm:w-auto justify-center">
              {t('help.view_docs', 'View Docs')}
            </button>
          </div>

          {docsOpen && (
            <div ref={docsAreaRef} className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5 animate-page-enter">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t('help.docs_title', 'Read the Documentation')}</h3>
                  <p className="text-sm text-gray-500">{t('help.docs_desc', 'Quick guides for the most common actions in TechMart.')}</p>
                </div>
                <button
                  onClick={() => setDocsOpen(false)}
                  className="text-sm font-semibold text-gray-500 hover:text-gray-900"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Getting Started</p>
                  <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                    <li>Open the dashboard and verify the current balances.</li>
                    <li>Check the Chart of Accounts before posting entries.</li>
                    <li>Use Journal to create balanced debit/credit entries.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Reports</p>
                  <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                    <li>Trial Balance shows all active accounts with totals.</li>
                    <li>Income Statement is filtered by date range.</li>
                    <li>Balance Sheet compares assets, liabilities, and equity.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">AI Support</p>
                  <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                    <li>Use Live Chat for login, reports, export, settings, and permission issues.</li>
                    <li>Ask system questions in plain English.</li>
                    <li>The assistant responds with short step-by-step fixes.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Shortcuts</p>
                  <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                    <li>Use the sidebar to jump between modules.</li>
                    <li>Press Ctrl+K for quick search.</li>
                    <li>Refresh the page after major updates.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
