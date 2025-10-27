import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Dimensions,
  TextInput,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoutes } from '@/contexts/RoutesContext';
import { RouteRecord } from '@/types/routes';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

export default function HistoryScreen() {
  const { records, deleteRecord, updateRecord } = useRoutes();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [recordToEdit, setRecordToEdit] = useState<RouteRecord | null>(null);
  const [editedDepartureTime, setEditedDepartureTime] = useState<string>('');
  const [editedSeal, setEditedSeal] = useState<string>('');

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [records]);

  const recordsByDate = useMemo(() => {
    const grouped = new Map<string, RouteRecord[]>();
    sortedRecords.forEach((record) => {
      const date = record.date;
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)?.push(record);
    });
    return grouped;
  }, [sortedRecords]);

  const dates = Array.from(recordsByDate.keys()).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const filteredRecords = recordsByDate.get(selectedDate) || [];

  const handleDelete = (recordId: string) => {
    setRecordToDelete(recordId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      deleteRecord(recordToDelete);
      setDeleteModalVisible(false);
      setRecordToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setRecordToDelete(null);
  };

  const handleEdit = (record: RouteRecord) => {
    setRecordToEdit(record);
    setEditedDepartureTime(record.departureTime || '');
    setEditedSeal(record.seal);
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (recordToEdit) {
      const updateData: RouteRecord = {
        ...recordToEdit,
        departureTime: editedDepartureTime || undefined,
        seal: editedSeal,
        createdAt: typeof recordToEdit.createdAt === 'string' 
          ? recordToEdit.createdAt 
          : new Date(recordToEdit.createdAt).toISOString(),
        vehiclePlate: recordToEdit.routeType === 'FURGO' ? recordToEdit.vehiclePlate : undefined,
        tractorPlate: recordToEdit.routeType === 'TRAILER' ? recordToEdit.tractorPlate : undefined,
        trailerPlate: recordToEdit.routeType === 'TRAILER' ? recordToEdit.trailerPlate : undefined,
      };
      await updateRecord(updateData);
      setEditModalVisible(false);
      setRecordToEdit(null);
      setEditedDepartureTime('');
      setEditedSeal('');
    }
  };

  const cancelEdit = () => {
    setEditModalVisible(false);
    setRecordToEdit(null);
    setEditedDepartureTime('');
    setEditedSeal('');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Historial', headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="calendar-outline" color={Colors.primary} size={28} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Historial</Text>
            <Text style={styles.headerSubtitle}>{records.length} registros totales</Text>
          </View>
        </View>

        <View style={styles.dateSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dates.map((date) => {
              const isSelected = date === selectedDate;
              const dateObj = new Date(date + 'T12:00:00');
              const count = recordsByDate.get(date)?.length || 0;
              
              return (
                <TouchableOpacity
                  key={date}
                  style={[styles.dateButton, isSelected && styles.dateButtonSelected]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                    {dateObj.toLocaleDateString('es-ES', { weekday: 'short' })}
                  </Text>
                  <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>
                    {dateObj.getDate()}
                  </Text>
                  <Text style={[styles.dateMonth, isSelected && styles.dateMonthSelected]}>
                    {dateObj.toLocaleDateString('es-ES', { month: 'short' })}
                  </Text>
                  <View style={[styles.dateBadge, isSelected && styles.dateBadgeSelected]}>
                    <Text style={[styles.dateBadgeText, isSelected && styles.dateBadgeTextSelected]}>
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {filteredRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" color={Colors.textSecondary} size={64} />
              <Text style={styles.emptyText}>No hay registros para esta fecha</Text>
            </View>
          ) : (
            <View style={styles.recordsList}>
              {filteredRecords.map((record) => (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View style={styles.recordTypeTag}>
                      <Text style={styles.recordTypeText}>{record.routeType}</Text>
                    </View>
                    <View style={styles.recordActions}>
                      <TouchableOpacity onPress={() => handleEdit(record)} style={styles.actionButton}>
                        <Ionicons name="pencil-outline" color={Colors.primary} size={20} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(record.id)} style={styles.actionButton}>
                        <Ionicons name="trash-outline" color={Colors.danger} size={20} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.recordRoute}>{record.routeName}</Text>

                  <View style={styles.recordSection}>
                    <Text style={styles.recordSectionTitle}>Conductores</Text>
                    {record.drivers.map((driver, index) => (
                      <View key={driver.id} style={styles.driverInfo}>
                        <Text style={styles.driverName}>{index + 1}. {driver.name}</Text>
                        <Text style={styles.driverDetail}>DNI: {driver.dni}</Text>
                        <Text style={styles.driverDetail}>Tel: {driver.phone}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.recordSection}>
                    <Text style={styles.recordSectionTitle}>Vehículos</Text>
                    {record.routeType === 'TRAILER' ? (
                      <>
                        <Text style={styles.vehicleDetail}>Tractora: {record.tractorPlate}</Text>
                        <Text style={styles.vehicleDetail}>Remolque: {record.trailerPlate}</Text>
                      </>
                    ) : (
                      <Text style={styles.vehicleDetail}>Furgoneta: {record.vehiclePlate}</Text>
                    )}
                  </View>

                  <View style={styles.recordFooter}>
                    <Text style={styles.sealText}>Precinto: {record.seal}</Text>
                    <View style={styles.timeSection}>
                      <Text style={styles.timeText}>
                        Entrada: {new Date(record.createdAt).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      {record.departureTime && (
                        <Text style={styles.departureText}>
                          Salida: {new Date(record.departureTime).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>

        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={cancelDelete}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.deleteModal}>
              <Text style={styles.deleteModalTitle}>Eliminar registro</Text>
              <Text style={styles.deleteModalText}>
                ¿Estás seguro de que quieres eliminar este registro?
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

        <Modal
          visible={editModalVisible}
          transparent
          animationType="slide"
          onRequestClose={cancelEdit}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editModal}>
              <View style={styles.editModalHeader}>
                <Ionicons name="time-outline" color={Colors.primary} size={24} />
                <Text style={styles.editModalTitle}>Editar Registro</Text>
              </View>
              
              {recordToEdit && (
                <View style={styles.editContent}>
                  <View style={styles.editInfo}>
                    <Text style={styles.editInfoLabel}>Ruta:</Text>
                    <Text style={styles.editInfoValue}>{recordToEdit.routeName}</Text>
                  </View>

                  <View style={styles.editInfo}>
                    <Text style={styles.editInfoLabel}>Hora de entrada:</Text>
                    <Text style={styles.editInfoValue}>
                      {new Date(recordToEdit.createdAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <View style={styles.editSection}>
                    <Text style={styles.editSectionTitle}>Número de precinto</Text>
                    <View style={styles.sealInputContainer}>
                      <Ionicons name="lock-closed-outline" color={Colors.textSecondary} size={20} />
                      <TextInput
                        style={styles.sealInput}
                        value={editedSeal}
                        onChangeText={setEditedSeal}
                        placeholder="Ingrese el número de precinto"
                        placeholderTextColor={Colors.textSecondary}
                      />
                    </View>
                  </View>

                  <View style={styles.editSection}>
                    <Text style={styles.editSectionTitle}>Hora de salida</Text>
                    <View style={styles.timeInputContainer}>
                      <Ionicons name="time-outline" color={Colors.textSecondary} size={20} />
                      <TouchableOpacity
                        style={styles.timeInput}
                        onPress={() => {
                          const now = new Date();
                          setEditedDepartureTime(now.toISOString());
                        }}
                      >
                        <Text style={styles.timeInputText}>
                          {editedDepartureTime
                            ? new Date(editedDepartureTime).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Establecer hora actual'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.editModalButtons}>
                <TouchableOpacity
                  style={[styles.editModalButton, styles.editCancelButton]}
                  onPress={cancelEdit}
                >
                  <Text style={styles.editCancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editModalButton, styles.editSaveButton]}
                  onPress={saveEdit}
                >
                  <Text style={styles.editSaveButtonText}>Guardar</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: IS_WEB ? 20 : 16,
    paddingTop: Platform.OS === 'ios' ? 60 : (IS_WEB ? 20 : 16),
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: IS_WEB ? 16 : 12,
  },
  headerIcon: {
    width: IS_WEB ? 56 : 48,
    height: IS_WEB ? 56 : 48,
    borderRadius: IS_WEB ? 28 : 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: IS_WEB ? 24 : 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dateSelector: {
    backgroundColor: Colors.card,
    paddingVertical: IS_WEB ? 16 : 12,
    paddingHorizontal: IS_WEB ? 20 : 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateButton: {
    alignItems: 'center',
    paddingVertical: IS_WEB ? 12 : 10,
    paddingHorizontal: IS_WEB ? 16 : 12,
    marginRight: 8,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    minWidth: IS_WEB ? 80 : 70,
  },
  dateButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateDay: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  dateDaySelected: {
    color: '#ffffff',
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  dateNumberSelected: {
    color: '#ffffff',
  },
  dateMonth: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  },
  dateMonthSelected: {
    color: '#ffffff',
  },
  dateBadge: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  dateBadgeSelected: {
    backgroundColor: '#ffffff',
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  dateBadgeTextSelected: {
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  recordsList: {
    padding: IS_WEB ? 20 : 12,
  },
  recordCard: {
    backgroundColor: Colors.card,
    borderRadius: IS_WEB ? 16 : 12,
    padding: IS_WEB ? 20 : 14,
    marginBottom: IS_WEB ? 16 : 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordTypeTag: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  recordTypeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  recordRoute: {
    fontSize: IS_WEB ? 18 : 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: IS_WEB ? 16 : 12,
  },
  recordSection: {
    marginBottom: IS_WEB ? 16 : 12,
  },
  recordSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  driverInfo: {
    marginBottom: 8,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  driverDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  vehicleDetail: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  recordActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sealText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  timeSection: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  departureText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
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
  editModal: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    }),
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  editModalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  editContent: {
    gap: 16,
    marginBottom: 24,
  },
  editInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  editInfoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  editInfoValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  editSection: {
    marginTop: 8,
  },
  editSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  timeInput: {
    flex: 1,
  },
  timeInputText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  sealInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  sealInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
    paddingVertical: 16,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none' as any,
    }),
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editCancelButton: {
    backgroundColor: Colors.border,
  },
  editCancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  editSaveButton: {
    backgroundColor: Colors.primary,
  },
  editSaveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
});
