import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoutes } from '@/contexts/RoutesContext';
import { RouteTemplate, RouteType } from '@/types/routes';
import Colors from '@/constants/colors';

export default function RoutesScreen() {
  const { routes, addRoute, deleteRoute, isAddingRoute } = useRoutes();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [routeName, setRouteName] = useState<string>('');
  const [routeType, setRouteType] = useState<RouteType>('TRAILER');
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  const trailerRoutes = routes.filter((r) => r.type === 'TRAILER');
  const furgoRoutes = routes.filter((r) => r.type === 'FURGO');

  const handleAddRoute = () => {
    if (!routeName.trim()) {
      return;
    }

    const newRoute: RouteTemplate = {
      id: Date.now().toString(),
      name: routeName.trim(),
      type: routeType,
    };

    addRoute(newRoute);
    setModalVisible(false);
    setRouteName('');
    setRouteType('TRAILER');
  };

  const handleDeleteRoute = (routeId: string) => {
    setRouteToDelete(routeId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (routeToDelete) {
      deleteRoute(routeToDelete);
      setDeleteModalVisible(false);
      setRouteToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setRouteToDelete(null);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Rutas', headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="map-outline" color={Colors.primary} size={28} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Gestión de Rutas</Text>
            <Text style={styles.headerSubtitle}>{routes.length} rutas configuradas</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" color="#ffffff" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.contentWrapper}>
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={Platform.OS === 'web'}
          >
            {trailerRoutes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>TRAILER ({trailerRoutes.length})</Text>
                {trailerRoutes.map((route) => (
                  <View key={route.id} style={styles.routeCard}>
                    <View style={styles.routeCardContent}>
                      <View style={styles.routeTypeIndicator} />
                      <Text style={styles.routeCardName}>{route.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteRoute(route.id)}>
                      <Ionicons name="trash-outline" color={Colors.danger} size={20} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {furgoRoutes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>FURGO ({furgoRoutes.length})</Text>
                {furgoRoutes.map((route) => (
                  <View key={route.id} style={styles.routeCard}>
                    <View style={styles.routeCardContent}>
                      <View style={[styles.routeTypeIndicator, styles.routeTypeIndicatorFurgo]} />
                      <Text style={styles.routeCardName}>{route.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteRoute(route.id)}>
                      <Ionicons name="trash-outline" color={Colors.danger} size={20} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {trailerRoutes.length === 0 && furgoRoutes.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="map-outline" color={Colors.textSecondary} size={48} />
                <Text style={styles.emptyStateTitle}>No hay rutas</Text>
                <Text style={styles.emptyStateText}>Crea tu primera ruta usando el botón +</Text>
              </View>
            )}
          </ScrollView>
        </View>

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva Ruta</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" color={Colors.text} size={24} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Nombre de la ruta</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: VLC–MADRID–VLC"
                placeholderTextColor={Colors.textSecondary}
                value={routeName}
                onChangeText={setRouteName}
                autoFocus
              />

              <Text style={styles.inputLabel}>Tipo de ruta</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, routeType === 'TRAILER' && styles.typeButtonSelected]}
                  onPress={() => setRouteType('TRAILER')}
                >
                  <Text style={[styles.typeButtonText, routeType === 'TRAILER' && styles.typeButtonTextSelected]}>
                    TRAILER
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, routeType === 'FURGO' && styles.typeButtonSelected]}
                  onPress={() => setRouteType('FURGO')}
                >
                  <Text style={[styles.typeButtonText, routeType === 'FURGO' && styles.typeButtonTextSelected]}>
                    FURGO
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isAddingRoute && styles.submitButtonDisabled]}
                onPress={handleAddRoute}
                disabled={isAddingRoute}
              >
                <Text style={styles.submitButtonText}>
                  {isAddingRoute ? 'Añadiendo...' : 'Añadir Ruta'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={cancelDelete}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.deleteModal}>
              <Text style={styles.deleteModalTitle}>Eliminar ruta</Text>
              <Text style={styles.deleteModalText}>
                ¿Estás seguro de que quieres eliminar esta ruta?
              </Text>
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={[styles.deleteModalButton, styles.cancelButton]}
                  onPress={cancelDelete}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteModalButton, styles.confirmButton]}
                  onPress={confirmDelete}
                >
                  <Text style={styles.confirmButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    ...(Platform.OS === 'web' && {
      maxHeight: '100vh',
      overflow: 'hidden',
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 16,
    ...(Platform.OS === 'web' && {
      flexShrink: 0,
    }),
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contentWrapper: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      maxWidth: 1200,
      width: '100%',
      alignSelf: 'center',
      overflow: 'hidden',
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    ...(Platform.OS === 'web' && {
      paddingHorizontal: 20,
    }),
  },
  section: {
    padding: 20,
    paddingTop: 24,
    ...(Platform.OS === 'web' && {
      padding: 0,
      paddingTop: 24,
    }),
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      cursor: 'default',
    }),
  },
  routeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  routeTypeIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  routeTypeIndicatorFurgo: {
    backgroundColor: Colors.secondary,
  },
  routeCardName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...(Platform.OS === 'web' && {
      position: 'fixed' as any,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
    }),
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  typeButtonTextSelected: {
    color: Colors.primary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  deleteModal: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    }),
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  deleteModalText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  confirmButton: {
    backgroundColor: Colors.danger,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    minHeight: 300,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
