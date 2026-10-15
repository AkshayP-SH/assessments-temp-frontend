import { formatDate } from '../../utils/dateTime';
import { createElement } from 'react';
import {
  Bell, MessageSquare, BookOpen, Video, Briefcase, ShieldAlert, CreditCard, Building2,
} from 'lucide-react';

// Icon per notification family (the part of the type before the dot)
const ICONS = {
  support: MessageSquare,
  test: BookOpen,
  interview: Video,
  job: Briefcase,
  proctoring: ShieldAlert,
  subscription: CreditCard,
  platform: Building2,
};

export const renderTypeIcon = (type = '', props = {}) =>
  createElement(ICONS[String(type).split('.')[0]] || Bell, props);

export const formatRelativeTime = (iso) => {
  if (!iso) return '';
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  if (diffMin < 10080) return `${Math.floor(diffMin / 1440)}d ago`;
  return formatDate(iso);
};
