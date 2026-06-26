import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface EventInviteProps {
  recipientName: string
  inviterName: string
  eventName: string
  eventIcon: string
  eventDateLabel: string   // e.g. "15 Jun → 28 Jun" or "From 15 Jun"
  groupName: string
  appUrl: string
}

export function EventInvite({
  recipientName,
  inviterName,
  eventName,
  eventIcon,
  eventDateLabel,
  groupName,
  appUrl,
}: EventInviteProps) {
  const previewText = `${inviterName} added you to ${eventIcon} ${eventName}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Text style={logo}>🏠 MyHome</Text>
          </Section>

          {/* Event badge */}
          <Section style={eventBadge}>
            <Text style={eventIconStyle}>{eventIcon}</Text>
            <Text style={eventNameStyle}>{eventName}</Text>
            <Text style={eventDateStyle}>{eventDateLabel}</Text>
            <Text style={groupNameStyle}>{groupName}</Text>
          </Section>

          {/* Body */}
          <Section style={content}>
            <Heading style={heading}>You&apos;ve been added to an event</Heading>
            <Text style={body}>
              Hi {recipientName},
            </Text>
            <Text style={body}>
              <strong>{inviterName}</strong> has added you to{" "}
              <strong>{eventIcon} {eventName}</strong>. You can now view and contribute
              to all finances, tasks, notes, and more for this event.
            </Text>

            <Button style={button} href={`${appUrl}/finance`}>
              Go to event →
            </Button>

            <Text style={hint}>
              The event will appear under <strong>Shared with me</strong> in your
              Settings → Events page. Click &ldquo;Go to event&rdquo; from there to
              activate it and start contributing.
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            You received this email because {inviterName} added you to a shared event on MyHome.
            If this was unexpected, you can ignore this message.
          </Text>

        </Container>
      </Body>
    </Html>
  )
}

export default EventInvite

// ─── Styles ──────────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  maxWidth: "520px",
}

const header: React.CSSProperties = {
  backgroundColor: "#6366f1",
  padding: "20px 32px",
}

const logo: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0",
}

const eventBadge: React.CSSProperties = {
  backgroundColor: "#f1f5f9",
  padding: "24px 32px",
  textAlign: "center",
  borderBottom: "1px solid #e2e8f0",
}

const eventIconStyle: React.CSSProperties = {
  fontSize: "40px",
  margin: "0 0 8px",
  lineHeight: "1",
}

const eventNameStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 0 4px",
}

const eventDateStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#64748b",
  margin: "0 0 4px",
}

const groupNameStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#94a3b8",
  margin: "0",
}

const content: React.CSSProperties = {
  padding: "32px",
}

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 0 16px",
}

const body: React.CSSProperties = {
  fontSize: "15px",
  color: "#334155",
  lineHeight: "1.6",
  margin: "0 0 16px",
}

const button: React.CSSProperties = {
  backgroundColor: "#6366f1",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
  display: "inline-block",
  margin: "8px 0 24px",
}

const hint: React.CSSProperties = {
  fontSize: "13px",
  color: "#64748b",
  lineHeight: "1.5",
  margin: "0",
}

const divider: React.CSSProperties = {
  borderColor: "#e2e8f0",
  margin: "0 32px",
}

const footer: React.CSSProperties = {
  fontSize: "12px",
  color: "#94a3b8",
  padding: "20px 32px",
  margin: "0",
  lineHeight: "1.5",
}
