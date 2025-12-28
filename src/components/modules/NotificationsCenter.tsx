import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Info, AlertCircle, CheckCircle, XCircle, Megaphone, X, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_by: string;
  expires_at: string | null;
  created_at: string;
  creator?: {
    first_name: string;
    last_name: string;
  };
}

export function NotificationsCenter() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'announcements'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    expires_at: ''
  });
  const { employee } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const canManageAnnouncements = employee?.grade === 'PDG' || employee?.grade === 'CoPDG';

  useEffect(() => {
    loadData();
  }, [employee]);

  const loadData = async () => {
    if (!employee) return;

    const [notificationsRes, announcementsRes] = await Promise.all([
      supabase
        .from('notifications')
        .select('*')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('announcements')
        .select(`
          *,
          creator:created_by(first_name, last_name)
        `)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
    ]);

    setNotifications(notificationsRes.data || []);
    setAnnouncements(announcementsRes.data || []);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    loadData();
  };

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('employee_id', employee!.id)
      .eq('is_read', false);

    showToast('Toutes les notifications marquées comme lues', 'success');
    loadData();
  };

  const deleteNotification = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    showToast('Notification supprimée', 'success');
    loadData();
  };

  const createAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) {
      showToast('Titre et contenu requis', 'error');
      return;
    }

    try {
      const announcementData: any = {
        title: announcementForm.title,
        content: announcementForm.content,
        priority: announcementForm.priority,
        created_by: employee!.id
      };

      if (announcementForm.expires_at) {
        announcementData.expires_at = new Date(announcementForm.expires_at).toISOString();
      }

      await supabase.from('announcements').insert(announcementData);

      showToast('Annonce créée avec succès', 'success');
      setShowAddAnnouncement(false);
      setAnnouncementForm({ title: '', content: '', priority: 'medium', expires_at: '' });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la création', 'error');
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      info: Info,
      success: CheckCircle,
      warning: AlertCircle,
      error: XCircle
    };
    return icons[type] || Info;
  };

  const getNotificationColor = (type: string) => {
    const colors: { [key: string]: string } = {
      info: 'blue',
      success: 'green',
      warning: 'yellow',
      error: 'red'
    };
    return colors[type] || 'blue';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: 'blue',
      medium: 'yellow',
      high: 'red'
    };
    return colors[priority] || 'yellow';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="h-full overflow-y-auto">
      {ToastComponent}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Centre de Notifications</h1>
        <p className="text-gray-400">Restez informé des dernières actualités</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap text-sm transition-all flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap text-sm transition-all flex items-center gap-2 ${
            activeTab === 'announcements'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Annonces
        </button>
      </div>

      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div className="backdrop-blur-xl bg-white/5 rounded-xl px-4 py-2 border border-white/10">
              <p className="text-sm text-gray-400">
                <span className="font-bold text-white">{unreadCount}</span> non lue(s)
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-xl font-semibold text-sm hover:bg-orange-500/30 transition-all"
              >
                <CheckCheck className="w-4 h-4" />
                Tout marquer comme lu
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
              <Bell className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Aucune notification</p>
            </div>
          ) : (
            notifications.map(notification => {
              const IconComponent = getNotificationIcon(notification.type);
              const color = getNotificationColor(notification.type);

              return (
                <div
                  key={notification.id}
                  className={`backdrop-blur-xl rounded-2xl p-6 border transition-all ${
                    notification.is_read
                      ? 'bg-white/5 border-white/10 opacity-70'
                      : 'bg-white/10 border-orange-500/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 bg-${color}-500/20 rounded-xl flex-shrink-0`}>
                      <IconComponent className={`w-6 h-6 text-${color}-400`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-white">{notification.title}</h3>
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-green-400 hover:text-green-300 transition-colors"
                              title="Marquer comme lu"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Supprimer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {canManageAnnouncements && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAddAnnouncement(true)}
                className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/50 transition-all"
              >
                <Plus className="w-5 h-5" />
                Créer une Annonce
              </button>
            </div>
          )}

          {announcements.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
              <Megaphone className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Aucune annonce active</p>
            </div>
          ) : (
            announcements.map(announcement => {
              const priorityColor = getPriorityColor(announcement.priority);

              return (
                <div
                  key={announcement.id}
                  className={`backdrop-blur-xl bg-gradient-to-br from-${priorityColor}-500/20 to-${priorityColor}-600/20 rounded-2xl p-6 border border-${priorityColor}-500/30`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 bg-${priorityColor}-500/20 rounded-xl flex-shrink-0`}>
                      <Megaphone className={`w-6 h-6 text-${priorityColor}-400`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-white">{announcement.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${priorityColor}-500/20 text-${priorityColor}-400`}>
                          {announcement.priority === 'high' ? 'Priorité Haute' :
                           announcement.priority === 'medium' ? 'Priorité Moyenne' :
                           'Priorité Basse'}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-4 whitespace-pre-wrap">{announcement.content}</p>
                      <div className="flex justify-between items-center text-sm text-gray-400">
                        <p>
                          Par {announcement.creator?.first_name} {announcement.creator?.last_name}
                        </p>
                        <p>{new Date(announcement.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                      {announcement.expires_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          Expire le {new Date(announcement.expires_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {showAddAnnouncement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full mx-4 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Créer une Annonce</h3>
              <button onClick={() => setShowAddAnnouncement(false)} className="text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Titre *</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="Ex: Nouvelle politique, Événement spécial..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Contenu *</label>
                <textarea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  placeholder="Décrivez l'annonce en détail..."
                  rows={5}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Priorité</label>
                <select
                  value={announcementForm.priority}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Date d'expiration (optionnel)</label>
                <input
                  type="date"
                  value={announcementForm.expires_at}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, expires_at: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddAnnouncement(false)}
                className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={createAnnouncement}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 rounded-xl font-semibold"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
