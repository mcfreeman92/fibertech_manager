import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * PickerModal - Componente Modal reutilizable para seleccionar opciones
 * Reemplaza RNPickerSelect con mejor experiencia en Android
 * 
 * Props:
 * - visible: boolean - Mostrar/ocultar modal
 * - onClose: function - Callback para cerrar modal
 * - onSelect: function - Callback cuando selecciona una opción (recibe value)
 * - items: array - Lista de opciones [{label: string, value: any}, ...]
 * - selectedValue: any - Valor seleccionado actualmente
 * - title: string - Título del modal (clave de traducción o string directo)
 * - isDarkMode: boolean - Tema oscuro
 * - colors: object - Objeto de colores {primary, card, text, border, etc}
 */
export const PickerModal = ({
  visible,
  onClose,
  onSelect,
  items,
  selectedValue,
  title = 'selectAnOption',
  isDarkMode,
  colors,
}) => {
  if (!colors) {
    colors = {
      primary: '#3498db',
      card: isDarkMode ? '#1e1e1e' : '#ffffff',
      text: isDarkMode ? '#ffffff' : '#2c3e50',
      border: isDarkMode ? '#333' : '#ecf0f1',
      background: isDarkMode ? '#121212' : '#ffffff',
      placeholder: isDarkMode ? '#888888' : '#a0a0a0',
    };
  }

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 12,
      width: '85%',
      maxHeight: '80%',
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    itemsList: {
      maxHeight: '85%',
    },
    item: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    selectedItemText: {
      fontWeight: '600',
      color: colors.primary,
    },
    checkIcon: {
      marginLeft: 10,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Items List */}
          <FlatList
            style={styles.itemsList}
            data={items}
            keyExtractor={(item) => item.value?.toString() || item.label}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            renderItem={({ item }) => {
              const isSelected = item.value === selectedValue;
              return (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    onSelect(item.value);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.itemText,
                      isSelected && styles.selectedItemText,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};
