import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRoutes } from '@/contexts/RoutesContext';
import { Driver, RouteRecord } from '@/types/routes';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';
const MAX_CONTENT_WIDTH = 1200;

export default function NewRecordScreen() {
  const { 
    routes, 
    addRecord, 
    isAddingRecord, 
    savedDrivers, 
    savedTractors,
    savedTrailers,
    savedVans,
    saveDriver, 
    saveTractor,
    saveTrailer,
    saveVan,
  } = useRoutes();

  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [drivers, setDrivers] = useState<Driver[]>([
    { id: '1', name: '', dni: '', phone: '' },
  ]);
  const [tractorPlate, setTractorPlate] = useState<string>('');
  const [trailerPlate, setTrailerPlate] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [seal, setSeal] = useState<string>('');
  
  const [driverModalVisible, setDriverModalVisible] = useState<boolean>(false);
  const [tractorModalVisible, setTractorModalVisible] = useState<boolean>(false);
  const [trailerModalVisible, setTrailerModalVisible] = useState<boolean>(false);
  const [vanModalVisible, setVanModalVisible] = useState<boolean>(false);
  const [selectedDriverIndex, setSelectedDriverIndex] = useState<number>(0);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);
  const isTrailer = selectedRoute?.type === 'TRAILER';

  const addDriver = () => {
    setDrivers([...drivers, { id: Date.now().toString(), name: '', dni: '', phone: '' }]);
  };

  const removeDriver = (id: string) => {
    if (drivers.length > 1) {
      setDrivers(drivers.filter((d) => d.id !== id));
    }
  };

  const updateDriver = (id: string, field: keyof Driver, value: string) => {
    setDrivers(drivers.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const handleSubmit = async () => {
    if (!selectedRoute) {
      Alert.alert('Error', 'Selecciona una ruta');
      return;
    }

    const hasEmptyDriver = drivers.some((d) => !d.name.trim() || !d.dni.trim() || !d.phone.trim());
    if (hasEmptyDriver) {
      Alert.alert('Error', 'Completa todos los datos de los conductores');
      return;
    }

    if (isTrailer && (!tractorPlate.trim() || !trailerPlate.trim())) {
      Alert.alert('Error', 'Completa las matrículas de tractora y remolque');
      return;
    }

    if (!isTrailer && !vehiclePlate.trim()) {
      Alert.alert('Error', 'Completa la matrícula del vehículo');
      return;
    }

    if (!seal.trim()) {
      Alert.alert('Error', 'Completa el número de precinto');
      return;
    }

    drivers.forEach((driver) => {
      saveDriver({ name: driver.name, dni: driver.dni, phone: driver.phone, routeId: selectedRoute.id });
    });

    if (isTrailer) {
      const normalizedTractorPlate = tractorPlate.trim().toUpperCase();
      const normalizedTrailerPlate = trailerPlate.trim().toUpperCase();
      await saveTractor({ plate: normalizedTractorPlate, routeId: selectedRoute.id });
      await saveTrailer({ plate: normalizedTrailerPlate, routeId: selectedRoute.id });
    } else {
      const normalizedVehiclePlate = vehiclePlate.trim().toUpperCase();
      await saveVan({ plate: normalizedVehiclePlate, routeId: selectedRoute.id });
    }

    const record: RouteRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      routeTemplateId: selectedRoute.id,
      routeName: selectedRoute.name,
      routeType: selectedRoute.type,
      drivers: drivers,
      tractorPlate: isTrailer ? tractorPlate.trim().toUpperCase() : undefined,
      trailerPlate: isTrailer ? trailerPlate.trim().toUpperCase() : undefined,
      vehiclePlate: !isTrailer ? vehiclePlate.trim().toUpperCase() : undefined,
      seal,
      createdAt: new Date().toISOString(),
    };

    addRecord(record);
    Alert.alert('Éxito', 'Registro guardado correctamente');
    resetForm();
  };

  const resetForm = () => {
    setSelectedRouteId('');
    setDrivers([{ id: '1', name: '', dni: '', phone: '' }]);
    setTractorPlate('');
    setTrailerPlate('');
    setVehiclePlate('');
    setSeal('');
  };

  const openDriverPicker = (index: number) => {
    setSelectedDriverIndex(index);
    setDriverModalVisible(true);
  };

  const selectDriver = (driverId: string) => {
    const driver = savedDrivers.find((d) => d.id === driverId);
    if (driver) {
      const currentDriverId = drivers[selectedDriverIndex].id;
      setDrivers(prev => prev.map(d => 
        d.id === currentDriverId 
          ? { ...d, name: driver.name, dni: driver.dni, phone: driver.phone }
          : d
      ));
    }
    setDriverModalVisible(false);
  };

  const selectTractor = (tractorId: string) => {
    const tractor = savedTractors.find((t) => t.id === tractorId);
    if (tractor) {
      setTractorPlate(tractor.plate);
    }
    setTractorModalVisible(false);
  };

  const selectTrailer = (trailerId: string) => {
    const trailer = savedTrailers.find((t) => t.id === trailerId);
    if (trailer) {
      setTrailerPlate(trailer.plate);
    }
    setTrailerModalVisible(false);
  };

  const selectVan = (vanId: string) => {
    const van = savedVans.find((v) => v.id === vanId);
    if (van) {
      setVehiclePlate(van.plate);
    }
    setVanModalVisible(false);
  };

  const filteredDrivers = useMemo(() => 
    savedDrivers.filter((d) => d.routeId === selectedRouteId),
    [savedDrivers, selectedRouteId]
  );

  const sortedDrivers = useMemo(() => 
    [...filteredDrivers].sort((a, b) => b.usageCount - a.usageCount),
    [filteredDrivers]
  );

  const sortedTractors = useMemo(() => 
    [...savedTractors]
      .filter((t) => t.routeId === selectedRouteId)
      .sort((a, b) => b.usageCount - a.usageCount),
    [savedTractors, selectedRouteId]
  );

  const sortedTrailers = useMemo(() => 
    [...savedTrailers]
      .filter((t) => t.routeId === selectedRouteId)
      .sort((a, b) => b.usageCount - a.usageCount),
    [savedTrailers, selectedRouteId]
  );

  const sortedVans = useMemo(() => 
    [...savedVans]
      .filter((v) => v.routeId === selectedRouteId)
      .sort((a, b) => b.usageCount - a.usageCount),
    [savedVans, selectedRouteId]
  );

  const contentStyle = IS_WEB && SCREEN_WIDTH > 768 
    ? [styles.content, { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const, width: '100%' }]
    : styles.contentMobile;

  return (
    <>
      <Stack.Screen options={{ title: 'Nuevo Registro', headerShown: false }} />
      <View style={styles.container}>
        <View style={[styles.header, IS_WEB && styles.headerWeb]}>
          <View style={contentStyle}>
            <View style={styles.headerInner}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIconContainer}>
                  <Ionicons name="car-outline" color={Colors.primary} size={24} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Nuevo Registro</Text>
                  <View style={styles.headerDateRow}>
                    <Ionicons name="calendar-outline" color={Colors.textSecondary} size={14} />
                    <Text style={styles.headerDate}>
                      {new Date().toLocaleDateString('es-ES', { 
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric' 
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Seleccionar Ruta</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{routes.length} disponibles</Text>
                </View>
              </View>
              
              <View style={styles.routeGrid}>
                {routes.map((route) => {
                  const isTrailerType = route.type === 'TRAILER';
                  return (
                    <TouchableOpacity
                      key={route.id}
                      style={[
                        styles.routeCard,
                        isTrailerType ? styles.routeCardTrailer : styles.routeCardVan,
                        selectedRouteId === route.id && styles.routeCardSelected,
                        selectedRouteId === route.id && (isTrailerType ? styles.routeCardSelectedTrailer : styles.routeCardSelectedVan),
                        IS_WEB && styles.routeCardWeb,
                      ]}
                      onPress={() => setSelectedRouteId(route.id)}
                    >
                      <View style={[
                        styles.routeTypeTag,
                        isTrailerType ? styles.routeTypeTagTrailer : styles.routeTypeTagVan,
                        selectedRouteId === route.id && (isTrailerType ? styles.routeTypeTagSelectedTrailer : styles.routeTypeTagSelectedVan),
                      ]}>
                        <Ionicons 
                          name={isTrailerType ? "cube-outline" : "car-outline"} 
                          size={12} 
                          color={selectedRouteId === route.id 
                            ? (isTrailerType ? '#7c3aed' : '#059669') 
                            : (isTrailerType ? '#a78bfa' : '#34d399')
                          } 
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[
                          styles.routeTypeText,
                          isTrailerType ? styles.routeTypeTextTrailer : styles.routeTypeTextVan,
                          selectedRouteId === route.id && (isTrailerType ? styles.routeTypeTextSelectedTrailer : styles.routeTypeTextSelectedVan),
                        ]}>
                          {isTrailerType ? 'TRÁILER' : 'FURGONETA'}
                        </Text>
                      </View>
                      <Text style={[
                        styles.routeName,
                        selectedRouteId === route.id && styles.routeNameSelected,
                      ]}>
                        {route.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {selectedRoute && (
              <>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Ionicons name="person-outline" color={Colors.primary} size={20} />
                      <Text style={styles.cardTitle}>Conductores</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={addDriver}>
                      <Ionicons name="add" color="#fff" size={18} />
                    </TouchableOpacity>
                  </View>

                  <View style={IS_WEB && SCREEN_WIDTH > 768 ? styles.driversGrid : undefined}>
                    {drivers.map((driver, index) => (
                      <View key={driver.id} style={styles.driverCard}>
                        <View style={styles.driverHeader}>
                          <View style={styles.driverNumberBadge}>
                            <Text style={styles.driverNumberText}>{index + 1}</Text>
                          </View>
                          {drivers.length > 1 && (
                            <TouchableOpacity 
                              onPress={() => removeDriver(driver.id)}
                              style={styles.removeBtn}
                            >
                              <Ionicons name="close" color={Colors.danger} size={18} />
                            </TouchableOpacity>
                          )}
                        </View>

                        {filteredDrivers.length > 0 && (
                          <TouchableOpacity
                            style={styles.quickSelectBtn}
                            onPress={() => openDriverPicker(index)}
                          >
                            <Ionicons name="person-outline" color={Colors.primary} size={16} />
                            <Text style={styles.quickSelectText}>Seleccionar guardado</Text>
                            <Ionicons name="chevron-down" color={Colors.primary} size={16} />
                          </TouchableOpacity>
                        )}

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Nombre completo</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Ej: Juan Pérez García"
                            placeholderTextColor={Colors.textSecondary}
                            value={driver.name}
                            onChangeText={(text) => updateDriver(driver.id, 'name', text)}
                          />
                        </View>

                        <View style={styles.inputRow}>
                          <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>DNI/NIE</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="12345678A"
                              placeholderTextColor={Colors.textSecondary}
                              value={driver.dni}
                              onChangeText={(text) => updateDriver(driver.id, 'dni', text)}
                            />
                          </View>
                          <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>Teléfono</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="600123456"
                              placeholderTextColor={Colors.textSecondary}
                              keyboardType="phone-pad"
                              value={driver.phone}
                              onChangeText={(text) => updateDriver(driver.id, 'phone', text)}
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Ionicons name="car-sport-outline" color={Colors.primary} size={20} />
                      <Text style={styles.cardTitle}>Vehículos</Text>
                    </View>
                  </View>

                  {isTrailer ? (
                    <View style={IS_WEB && SCREEN_WIDTH > 768 ? styles.vehiclesRow : undefined}>
                      <View style={[styles.vehicleGroup, IS_WEB && SCREEN_WIDTH > 768 && { flex: 1 }]}>
                        <Text style={styles.vehicleTitle}>Tractora</Text>
                        {sortedTractors.length > 0 && (
                          <TouchableOpacity
                            style={styles.quickSelectBtn}
                            onPress={() => setTractorModalVisible(true)}
                          >
                            <Ionicons name="car-sport-outline" color={Colors.primary} size={16} />
                            <Text style={styles.quickSelectText}>
                              {sortedTractors.length} guardada{sortedTractors.length !== 1 ? 's' : ''}
                            </Text>
                            <Ionicons name="chevron-down" color={Colors.primary} size={16} />
                          </TouchableOpacity>
                        )}
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Matrícula</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="1234ABC"
                            placeholderTextColor={Colors.textSecondary}
                            value={tractorPlate}
                            onChangeText={setTractorPlate}
                            autoCapitalize="characters"
                          />
                        </View>
                      </View>

                      <View style={[styles.vehicleGroup, IS_WEB && SCREEN_WIDTH > 768 && { flex: 1 }]}>
                        <Text style={styles.vehicleTitle}>Remolque</Text>
                        {sortedTrailers.length > 0 && (
                          <TouchableOpacity
                            style={styles.quickSelectBtn}
                            onPress={() => setTrailerModalVisible(true)}
                          >
                            <Ionicons name="car-sport-outline" color={Colors.primary} size={16} />
                            <Text style={styles.quickSelectText}>
                              {sortedTrailers.length} guardado{sortedTrailers.length !== 1 ? 's' : ''}
                            </Text>
                            <Ionicons name="chevron-down" color={Colors.primary} size={16} />
                          </TouchableOpacity>
                        )}
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Matrícula</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="5678DEF"
                            placeholderTextColor={Colors.textSecondary}
                            value={trailerPlate}
                            onChangeText={setTrailerPlate}
                            autoCapitalize="characters"
                          />
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.vehicleGroup}>
                      <Text style={styles.vehicleTitle}>Furgoneta</Text>
                      {sortedVans.length > 0 && (
                        <TouchableOpacity
                          style={styles.quickSelectBtn}
                          onPress={() => setVanModalVisible(true)}
                        >
                          <Ionicons name="car-sport-outline" color={Colors.primary} size={16} />
                          <Text style={styles.quickSelectText}>
                            {sortedVans.length} guardada{sortedVans.length !== 1 ? 's' : ''}
                          </Text>
                          <Ionicons name="chevron-down" color={Colors.primary} size={16} />
                        </TouchableOpacity>
                      )}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Matrícula</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="9012GHI"
                          placeholderTextColor={Colors.textSecondary}
                          value={vehiclePlate}
                          onChangeText={setVehiclePlate}
                          autoCapitalize="characters"
                        />
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Ionicons name="lock-closed-outline" color={Colors.primary} size={20} />
                      <Text style={styles.cardTitle}>Precinto</Text>
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Número de precinto</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej: SEAL12345"
                      placeholderTextColor={Colors.textSecondary}
                      value={seal}
                      onChangeText={setSeal}
                    />
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={resetForm}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, isAddingRecord && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isAddingRecord}
                  >
                    <Text style={styles.submitButtonText}>
                      {isAddingRecord ? 'Guardando...' : 'Guardar Registro'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <Modal
          visible={driverModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDriverModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, IS_WEB && styles.modalContentWeb]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Conductor</Text>
                <TouchableOpacity onPress={() => setDriverModalVisible(false)}>
                  <Ionicons name="close" color={Colors.text} size={24} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {sortedDrivers.map((driver) => (
                  <TouchableOpacity
                    key={driver.id}
                    style={styles.modalItem}
                    onPress={() => selectDriver(driver.id)}
                  >
                    <View style={styles.modalItemLeft}>
                      <View style={styles.modalItemIcon}>
                        <Ionicons name="person-outline" color={Colors.primary} size={20} />
                      </View>
                      <View style={styles.modalItemContent}>
                        <Text style={styles.modalItemName}>{driver.name}</Text>
                        <Text style={styles.modalItemDetails}>{driver.dni} • {driver.phone}</Text>
                        <Text style={styles.modalItemUsage}>
                          Usado {driver.usageCount} {driver.usageCount === 1 ? 'vez' : 'veces'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons 
                      name="chevron-forward" 
                      color={Colors.textSecondary} 
                      size={20} 
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={tractorModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setTractorModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, IS_WEB && styles.modalContentWeb]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Tractora</Text>
                <TouchableOpacity onPress={() => setTractorModalVisible(false)}>
                  <Ionicons name="close" color={Colors.text} size={24} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {sortedTractors.map((tractor) => (
                  <TouchableOpacity
                    key={tractor.id}
                    style={styles.modalItem}
                    onPress={() => selectTractor(tractor.id)}
                  >
                    <View style={styles.modalItemLeft}>
                      <View style={styles.modalItemIcon}>
                        <Ionicons name="car-sport-outline" color={Colors.primary} size={20} />
                      </View>
                      <View style={styles.modalItemContent}>
                        <Text style={styles.modalItemName}>{tractor.plate}</Text>
                        <Text style={styles.modalItemDetails}>Tractora</Text>
                        <Text style={styles.modalItemUsage}>
                          Usado {tractor.usageCount} {tractor.usageCount === 1 ? 'vez' : 'veces'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons 
                      name="chevron-forward" 
                      color={Colors.textSecondary} 
                      size={20} 
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={trailerModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setTrailerModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, IS_WEB && styles.modalContentWeb]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Remolque</Text>
                <TouchableOpacity onPress={() => setTrailerModalVisible(false)}>
                  <Ionicons name="close" color={Colors.text} size={24} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {sortedTrailers.map((trailer) => (
                  <TouchableOpacity
                    key={trailer.id}
                    style={styles.modalItem}
                    onPress={() => selectTrailer(trailer.id)}
                  >
                    <View style={styles.modalItemLeft}>
                      <View style={styles.modalItemIcon}>
                        <Ionicons name="car-sport-outline" color={Colors.primary} size={20} />
                      </View>
                      <View style={styles.modalItemContent}>
                        <Text style={styles.modalItemName}>{trailer.plate}</Text>
                        <Text style={styles.modalItemDetails}>Remolque</Text>
                        <Text style={styles.modalItemUsage}>
                          Usado {trailer.usageCount} {trailer.usageCount === 1 ? 'vez' : 'veces'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons 
                      name="chevron-forward" 
                      color={Colors.textSecondary} 
                      size={20} 
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={vanModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setVanModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, IS_WEB && styles.modalContentWeb]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Furgoneta</Text>
                <TouchableOpacity onPress={() => setVanModalVisible(false)}>
                  <Ionicons name="close" color={Colors.text} size={24} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {sortedVans.map((van) => (
                  <TouchableOpacity
                    key={van.id}
                    style={styles.modalItem}
                    onPress={() => selectVan(van.id)}
                  >
                    <View style={styles.modalItemLeft}>
                      <View style={styles.modalItemIcon}>
                        <Ionicons name="car-sport-outline" color={Colors.primary} size={20} />
                      </View>
                      <View style={styles.modalItemContent}>
                        <Text style={styles.modalItemName}>{van.plate}</Text>
                        <Text style={styles.modalItemDetails}>Furgoneta</Text>
                        <Text style={styles.modalItemUsage}>
                          Usado {van.usageCount} {van.usageCount === 1 ? 'vez' : 'veces'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons 
                      name="chevron-forward" 
                      color={Colors.textSecondary} 
                      size={20} 
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
    backgroundColor: '#f5f7fa',
  },
  content: {
    paddingHorizontal: 16,
  },
  contentMobile: {
    paddingHorizontal: 12,
  },
  header: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    paddingBottom: 12,
    paddingHorizontal: IS_WEB ? 0 : 12,
  },
  headerWeb: {
    paddingTop: 16,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    width: IS_WEB ? 48 : 40,
    height: IS_WEB ? 48 : 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: IS_WEB ? 20 : 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  headerDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    paddingTop: IS_WEB ? 20 : 12,
    gap: IS_WEB ? 16 : 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: IS_WEB ? 16 : 12,
    padding: IS_WEB ? 20 : 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: IS_WEB ? 18 : 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  badge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  routeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  routeCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: IS_WEB ? 16 : 12,
    minWidth: IS_WEB ? 140 : 'auto' as any,
    flex: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  routeCardTrailer: {
    backgroundColor: '#faf5ff',
    borderColor: '#e9d5ff',
  },
  routeCardVan: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  routeCardWeb: {
    minWidth: 180,
    maxWidth: '48%',
  },
  routeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  routeCardSelectedTrailer: {
    borderColor: '#7c3aed',
    backgroundColor: '#f3e8ff',
  },
  routeCardSelectedVan: {
    borderColor: '#059669',
    backgroundColor: '#d1fae5',
  },
  routeTypeTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.textSecondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  routeTypeTagTrailer: {
    backgroundColor: '#ede9fe',
  },
  routeTypeTagVan: {
    backgroundColor: '#d1fae5',
  },
  routeTypeTagSelected: {
    backgroundColor: Colors.primary + '20',
  },
  routeTypeTagSelectedTrailer: {
    backgroundColor: '#ddd6fe',
  },
  routeTypeTagSelectedVan: {
    backgroundColor: '#a7f3d0',
  },
  routeTypeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  routeTypeTextTrailer: {
    color: '#a78bfa',
  },
  routeTypeTextVan: {
    color: '#34d399',
  },
  routeTypeTextSelected: {
    color: Colors.primary,
  },
  routeTypeTextSelectedTrailer: {
    color: '#7c3aed',
  },
  routeTypeTextSelectedVan: {
    color: '#059669',
  },
  routeName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  routeNameSelected: {
    color: Colors.primary,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driversGrid: {
    gap: 12,
  },
  driverCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: IS_WEB ? 16 : 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  driverNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.danger + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  quickSelectText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  inputGroup: {
    marginBottom: IS_WEB ? 12 : 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: IS_WEB ? 12 : 10,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  vehiclesRow: {
    flexDirection: 'row',
    gap: 16,
  },
  vehicleGroup: {
    marginBottom: 12,
  },
  vehicleTitle: {
    fontSize: IS_WEB ? 16 : 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: IS_WEB ? 12 : 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  submitButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
      },
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalContentWeb: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    borderRadius: 24,
    maxHeight: '80%',
    marginVertical: 'auto' as any,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalList: {
    padding: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  modalItemDetails: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  modalItemUsage: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
});
