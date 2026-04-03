'use client';

import { usePresenceStore } from '@/store/presenceStore';
import { Avatar } from '@/components/ui/Avatar';
import { Tooltip } from '@/components/ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';

interface PresenceAvatarsProps {
  maxVisible?: number;
}

export function PresenceAvatars({ maxVisible = 5 }: PresenceAvatarsProps) {
  const { users, localClientId } = usePresenceStore();

  const remoteUsers = Array.from(users.entries())
    .filter(([clientId]) => clientId !== localClientId)
    .map(([clientId, user]) => ({ clientId, ...user }));

  const visibleUsers = remoteUsers.slice(0, maxVisible);
  const overflowCount = remoteUsers.length - maxVisible;

  if (remoteUsers.length === 0) return null;

  return (
    <div className="flex items-center -space-x-2">
      <AnimatePresence mode="popLayout">
        {visibleUsers.map((user) => (
          <motion.div
            key={user.clientId}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            layout
          >
            <Tooltip content={user.user.name}>
              <div
                className="relative h-7 w-7 rounded-full ring-2 ring-white dark:ring-neutral-900"
                style={{ zIndex: visibleUsers.length - visibleUsers.indexOf(user) }}
              >
                <Avatar
                  name={user.user.name}
                  src={user.user.avatar_url}
                  color={user.user.color}
                  size="sm"
                />
                {/* Online indicator dot */}
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-neutral-900"
                />
              </div>
            </Tooltip>
          </motion.div>
        ))}
      </AnimatePresence>

      {overflowCount > 0 && (
        <div className="z-0 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-medium text-neutral-600 ring-2 ring-white dark:bg-neutral-700 dark:text-neutral-300 dark:ring-neutral-900">
          +{overflowCount}
        </div>
      )}
    </div>
  );
}
