import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  MessageSquare,
  Link2,
  FlaskConical,
  Loader2,
  Plus,
  Trash2,
  Send,
  Settings,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
  useIntegrationConfig,
  useUpdateIntegrationConfig,
  useSendTestEmail,
  useSendTestSms,
} from "@/hooks/useIntegrations";
import type { WebhookConfig, IntegrationConfig } from "@/types/integration";
import { WEBHOOK_EVENTS } from "@/types/integration";
import { useLanguage } from "@/hooks/useLanguage";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

export default function Integrations() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("email");

  // Email config form
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");

  // SMS config form
  const [smsProvider, setSmsProvider] = useState("");
  const [smsApiKey, setSmsApiKey] = useState("");

  // Test email form
  const [testEmailTo, setTestEmailTo] = useState("");
  const [testEmailSubject, setTestEmailSubject] = useState("");
  const [testEmailBody, setTestEmailBody] = useState("");

  // Test SMS form
  const [testSmsPhone, setTestSmsPhone] = useState("");
  const [testSmsMessage, setTestSmsMessage] = useState("");

  // Webhook form
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [deleteWebhookTarget, setDeleteWebhookTarget] = useState<WebhookConfig | null>(null);

  const { data: webhooks = [], isLoading: webhooksLoading } = useWebhooks();
  const createWebhookMutation = useCreateWebhook();
  const deleteWebhookMutation = useDeleteWebhook();

  const { data: integrationConfig } = useIntegrationConfig();
  const updateConfigMutation = useUpdateIntegrationConfig();

  const testEmailMutation = useSendTestEmail();
  const testSmsMutation = useSendTestSms();

  // Populate forms from config when loaded
  useEffect(() => {
    if (integrationConfig) {
      setSmtpHost(integrationConfig.smtpHost || "");
      setSmtpPort(String(integrationConfig.smtpPort || 587));
      setSmtpUsername(integrationConfig.smtpUsername || "");
      setSmsProvider(integrationConfig.smsProvider || "");
      setSmsApiKey(integrationConfig.smsApiKey || "");
    }
  }, [integrationConfig]);

  const handleSaveEmailConfig = () => {
    if (!integrationConfig) return;
    const updated: IntegrationConfig = {
      ...integrationConfig,
      smtpHost,
      smtpPort: parseInt(smtpPort) || 587,
      smtpUsername,
      smtpPassword: smtpPassword || integrationConfig.smtpPassword,
    };
    updateConfigMutation.mutate(updated);
  };

  const handleSaveSmsConfig = () => {
    if (!integrationConfig) return;
    const updated: IntegrationConfig = {
      ...integrationConfig,
      smsProvider,
      smsApiKey,
    };
    updateConfigMutation.mutate(updated);
  };

  const handleSendTestEmail = () => {
    testEmailMutation.mutate({
      to: testEmailTo,
      subject: testEmailSubject || "Test Email",
      body: testEmailBody || "Ceci est un email de test.",
    });
  };

  const handleSendTestSms = () => {
    testSmsMutation.mutate({
      phoneNumber: testSmsPhone,
      message: testSmsMessage || "Ceci est un SMS de test.",
    });
  };

  const handleAddWebhook = () => {
    createWebhookMutation.mutate(
      {
        url: webhookUrl,
        events: webhookEvents,
        secret: webhookSecret,
        active: true,
      },
      {
        onSuccess: () => {
          setShowAddWebhook(false);
          setWebhookUrl("");
          setWebhookSecret("");
          setWebhookEvents([]);
        },
      }
    );
  };

  const handleDeleteWebhook = () => {
    if (!deleteWebhookTarget?.id) return;
    deleteWebhookMutation.mutate(deleteWebhookTarget.id, {
      onSuccess: () => setDeleteWebhookTarget(null),
    });
  };

  const toggleWebhookEvent = (event: string) => {
    setWebhookEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
          {t("integrations.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("integrations.subtitle")}
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="email" className="gap-1.5">
            <Mail className="h-4 w-4" /> Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-1.5">
            <MessageSquare className="h-4 w-4" /> SMS
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1.5">
            <Link2 className="h-4 w-4" /> Webhooks
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-1.5">
            <FlaskConical className="h-4 w-4" /> Test
          </TabsTrigger>
        </TabsList>

        {/* Email Tab */}
        <TabsContent value="email" className="mt-4">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card p-6 shadow-sm max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">{t("integrations.smtpConfig")}</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="smtpHost">{t("integrations.smtpServer")}</Label>
                  <Input
                    id="smtpHost"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="smtpPort">{t("integrations.port")}</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="587"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtpUser">{t("integrations.username")}</Label>
                <Input
                  id="smtpUser"
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtpPass">{t("common.password")}</Label>
                <Input
                  id="smtpPass"
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder={t("integrations.keepEmpty")}
                />
              </div>
              <Button
                onClick={handleSaveEmailConfig}
                disabled={updateConfigMutation.isPending}
              >
                {updateConfigMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 me-1.5 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  t("common.save")
                )}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms" className="mt-4">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card p-6 shadow-sm max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">
                {t("integrations.smsProvider")}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="smsProvider">{t("integrations.smsProvider")}</Label>
                <Input
                  id="smsProvider"
                  value={smsProvider}
                  onChange={(e) => setSmsProvider(e.target.value)}
                  placeholder="Twilio, Vonage, etc."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smsApiKey">{t("integrations.apiKey")}</Label>
                <Input
                  id="smsApiKey"
                  type="password"
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  placeholder={t("integrations.apiKeyPlaceholder")}
                />
              </div>
              <Button
                onClick={handleSaveSmsConfig}
                disabled={updateConfigMutation.isPending}
              >
                {updateConfigMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 me-1.5 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  t("common.save")
                )}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="mt-4 space-y-4">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex justify-end"
          >
            <Button onClick={() => setShowAddWebhook(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> {t("integrations.addWebhook")}
            </Button>
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
          >
            {webhooksLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                        URL
                      </th>
                      <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">
                        Evenements
                      </th>
                      <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                        Statut
                      </th>
                      <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhooks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-16 text-center text-muted-foreground"
                        >
                          <Link2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">{t("integrations.noWebhook")}</p>
                          <p className="text-xs mt-1">
                            Ajoutez des webhooks pour recevoir des notifications
                          </p>
                        </td>
                      </tr>
                    ) : (
                      webhooks.map((wh) => (
                        <tr
                          key={wh.id}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-foreground max-w-[250px] truncate">
                            {wh.url}
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {wh.events?.slice(0, 3).map((ev) => (
                                <Badge
                                  key={ev}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {ev}
                                </Badge>
                              ))}
                              {(wh.events?.length ?? 0) > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(wh.events?.length ?? 0) - 3}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={wh.active ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {wh.active ? t("common.active") : t("common.inactive")}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-600"
                              onClick={() => setDeleteWebhookTarget(wh)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
            {/* Test Email */}
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="rounded-xl border border-border/50 bg-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-foreground">
                  {t("integrations.testEmail")}
                </h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="testTo">{t("common.recipient")}</Label>
                  <Input
                    id="testTo"
                    type="email"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="testSubject">{t("integrations.emailSubject")}</Label>
                  <Input
                    id="testSubject"
                    value={testEmailSubject}
                    onChange={(e) => setTestEmailSubject(e.target.value)}
                    placeholder="Test Email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="testBody">{t("integrations.emailBody")}</Label>
                  <Textarea
                    id="testBody"
                    value={testEmailBody}
                    onChange={(e) => setTestEmailBody(e.target.value)}
                    placeholder="Ceci est un email de test..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleSendTestEmail}
                  disabled={!testEmailTo || testEmailMutation.isPending}
                  className="w-full gap-1.5"
                >
                  {testEmailMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {t("common.sending")}
                    </>
                  ) : testEmailMutation.isSuccess ? (
                    <>
                      <Check className="h-4 w-4" /> {t("common.success")}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> {t("common.send")}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Test SMS */}
            <motion.div
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="rounded-xl border border-border/50 bg-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-foreground">
                  {t("integrations.testSms")}
                </h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="testPhone">{t("integrations.phoneNumber")}</Label>
                  <Input
                    id="testPhone"
                    type="tel"
                    value={testSmsPhone}
                    onChange={(e) => setTestSmsPhone(e.target.value)}
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="testSmsMsg">{t("common.message")}</Label>
                  <Textarea
                    id="testSmsMsg"
                    value={testSmsMessage}
                    onChange={(e) => setTestSmsMessage(e.target.value)}
                    placeholder="Ceci est un SMS de test..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleSendTestSms}
                  disabled={!testSmsPhone || testSmsMutation.isPending}
                  className="w-full gap-1.5"
                >
                  {testSmsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {t("common.sending")}
                    </>
                  ) : testSmsMutation.isSuccess ? (
                    <>
                      <Check className="h-4 w-4" /> {t("common.success")}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> {t("common.send")}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Webhook Dialog */}
      <Dialog open={showAddWebhook} onOpenChange={setShowAddWebhook}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("integrations.addWebhook")}</DialogTitle>
            <DialogDescription>
              {t("integrations.addWebhook")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="whUrl">URL du webhook</Label>
              <Input
                id="whUrl"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhook"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whSecret">{t("integrations.secret")}</Label>
              <Input
                id="whSecret"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder={t("integrations.secretDesc")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("integrations.events")}</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                {WEBHOOK_EVENTS.map((event) => (
                  <div key={event} className="flex items-center gap-2">
                    <Checkbox
                      id={`event-${event}`}
                      checked={webhookEvents.includes(event)}
                      onCheckedChange={() => toggleWebhookEvent(event)}
                    />
                    <label
                      htmlFor={`event-${event}`}
                      className="text-xs cursor-pointer"
                    >
                      {event === "*" ? t("integrations.allEvents") : event}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button
              onClick={handleAddWebhook}
              disabled={!webhookUrl || createWebhookMutation.isPending}
            >
              {createWebhookMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 me-1.5 animate-spin" />
                  Ajout...
                </>
              ) : (
                t("common.add")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Webhook Confirmation */}
      <Dialog
        open={!!deleteWebhookTarget}
        onOpenChange={(open) => !open && setDeleteWebhookTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("integrations.deleteWebhook")}</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer le webhook vers{" "}
              <span className="font-semibold text-foreground">
                {deleteWebhookTarget?.url}
              </span>{" "}
              ? Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteWebhook}
              disabled={deleteWebhookMutation.isPending}
            >
              {deleteWebhookMutation.isPending
                ? t("common.deleting")
                : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
