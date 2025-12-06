# Flutter Bildirim Sistemi Kurulum Rehberi

Bu dokümantasyon, web uygulamasından gönderilen push bildirimlerinin Flutter mobil uygulamada nasıl handle edileceğini açıklar.

## URL Routing Mantığı

Web uygulamasındaki URL'ler mobil uygulamada da aynı mantıkla çalışır. Örneğin:
- `/plans` → PlansPage
- `/contact` → ContactPage
- `/denemeler/[denemeId]` → DenemeDetailPage
- `/profile` → ProfilePage

## 1. Gerekli Paketler

`pubspec.yaml` dosyasına ekleyin:

```yaml
dependencies:
  firebase_core: ^3.0.0
  firebase_messaging: ^15.0.0
  flutter_local_notifications: ^17.0.0
  go_router: ^14.0.0  # Deep linking için
```

## 2. Android Yapılandırması

### android/app/google-services.json
Firebase Console'dan indirip `android/app/` klasörüne koyun.

### android/build.gradle
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

### android/app/build.gradle
```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.4.0'
}
```

### android/app/src/main/AndroidManifest.xml
```xml
<manifest>
    <application>
        <!-- FCM için gerekli -->
        <service
            android:name="com.google.firebase.messaging.FirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
        
        <!-- Notification channel -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="high_importance_channel" />
    </application>
</manifest>
```

## 3. iOS Yapılandırması

### ios/Runner/GoogleService-Info.plist
Firebase Console'dan indirip `ios/Runner/` klasörüne koyun.

### ios/Podfile
```ruby
platform :ios, '12.0'

target 'Runner' do
  use_frameworks!
  use_modular_headers!

  pod 'Firebase/Messaging'
end
```

### ios/Runner/Info.plist
```xml
<key>FirebaseAppDelegateProxyEnabled</key>
<false/>
```

APNs sertifikalarını Firebase Console'a yükleyin.

## 4. URL Routing Yapılandırması

### lib/router/app_router.dart
```dart
import 'package:go_router/go_router.dart';
import '../pages/home_page.dart';
import '../pages/plans_page.dart';
import '../pages/contact_page.dart';
import '../pages/profile_page.dart';
import '../pages/denemeler/deneme_list_page.dart';
import '../pages/denemeler/deneme_detail_page.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomePage(),
    ),
    GoRoute(
      path: '/plans',
      builder: (context, state) => const PlansPage(),
    ),
    GoRoute(
      path: '/contact',
      builder: (context, state) => const ContactPage(),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfilePage(),
    ),
    GoRoute(
      path: '/denemeler',
      builder: (context, state) => const DenemeListPage(),
    ),
    GoRoute(
      path: '/denemeler/:denemeId',
      builder: (context, state) {
        final denemeId = state.pathParameters['denemeId']!;
        return DenemeDetailPage(denemeId: denemeId);
      },
    ),
    // Diğer route'lar...
  ],
);
```

## 5. Notification Service

### lib/services/notification_service.dart
```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:go_router/go_router.dart';
import '../router/app_router.dart';
import 'api_service.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    // Notification permission
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Token al ve backend'e gönder
      String? token = await _messaging.getToken();
      if (token != null) {
        await ApiService.registerFCMToken(token);
      }

      // Token refresh listener
      _messaging.onTokenRefresh.listen((newToken) {
        ApiService.registerFCMToken(newToken);
      });
    }

    // Local notifications setup
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Foreground message handler
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Background message handler (top-level function olmalı)
    FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);

    // Notification opened app (app kapalıyken açıldığında)
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationClick);

    // App kapalıyken açıldığında kontrol et
    RemoteMessage? initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationClick(initialMessage);
    }
  }

  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    // Foreground'da bildirim göster
    final notification = message.notification;
    if (notification != null) {
      await _localNotifications.show(
        message.hashCode,
        notification.title,
        notification.body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'high_importance_channel',
            'High Importance Notifications',
            importance: Importance.high,
            priority: Priority.high,
          ),
          iOS: DarwinNotificationDetails(),
        ),
        payload: message.data['redirectUrl'] ?? '/',
      );
    }
  }

  static void _onNotificationTapped(NotificationResponse response) {
    if (response.payload != null) {
      _navigateToRoute(response.payload!);
    }
  }

  static void _handleNotificationClick(RemoteMessage message) {
    final redirectUrl = message.data['redirectUrl'] ?? '/';
    _navigateToRoute(redirectUrl);
  }

  static void _navigateToRoute(String url) {
    // URL'yi parse et ve route'a çevir
    final uri = Uri.parse(url);
    final path = uri.path;
    
    // Query parametrelerini al
    final queryParams = uri.queryParameters;
    
    // GoRouter ile navigate et
    appRouter.go(path, extra: queryParams);
  }
}

// Background message handler (top-level function)
@pragma('vm:entry-point')
Future<void> _handleBackgroundMessage(RemoteMessage message) async {
  // Background'da bildirim göster
  final notification = message.notification;
  if (notification != null) {
    final FlutterLocalNotificationsPlugin localNotifications =
        FlutterLocalNotificationsPlugin();
    
    await localNotifications.show(
      message.hashCode,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'high_importance_channel',
          'High Importance Notifications',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
      payload: message.data['redirectUrl'] ?? '/',
    );
  }
}
```

## 6. API Service

### lib/services/api_service.dart
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';

class ApiService {
  static const String baseUrl = 'https://your-web-app-domain.com'; // Web uygulamanızın URL'i

  static Future<void> registerFCMToken(String token) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;

      final idToken = await user.getIdToken();
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/notifications/register-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $idToken',
        },
        body: jsonEncode({
          'token': token,
          'platform': 'mobile',
        }),
      );

      if (response.statusCode != 200) {
        print('Failed to register FCM token: ${response.body}');
      }
    } catch (e) {
      print('Error registering FCM token: $e');
    }
  }
}
```

## 7. Main.dart Entegrasyonu

### lib/main.dart
```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:go_router/go_router.dart';
import 'firebase_options.dart';
import 'router/app_router.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Firebase initialize
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  // Notification service initialize
  await NotificationService.initialize();
  
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Memur Jargonu',
      routerConfig: appRouter,
    );
  }
}
```

## 8. URL Mapping Örnekleri

Web URL'leri Flutter route'larına şu şekilde map edilir:

| Web URL | Flutter Route | Açıklama |
|---------|---------------|----------|
| `/` | `/` | Ana sayfa |
| `/plans` | `/plans` | Paketler sayfası |
| `/contact` | `/contact` | İletişim sayfası |
| `/profile` | `/profile` | Profil sayfası |
| `/denemeler` | `/denemeler` | Deneme listesi |
| `/denemeler/123` | `/denemeler/:denemeId` | Deneme detay |
| `/cografya-denemeler` | `/cografya-denemeler` | Coğrafya denemeleri |
| `/tarih-denemeler/456` | `/tarih-denemeler/:denemeId` | Tarih deneme detay |

## 9. Test Etme

1. Flutter uygulamasını çalıştırın
2. Admin panelinden bildirim gönderin (redirectUrl: `/plans` gibi)
3. Bildirime tıklayın
4. Uygulama ilgili sayfaya yönlendirilmeli

## Önemli Notlar

1. **Deep Linking**: URL'ler otomatik olarak route'lara çevrilir
2. **Query Parameters**: URL'de `?param=value` varsa `extra` ile geçirilir
3. **Dynamic Routes**: `:denemeId` gibi parametreler `pathParameters` ile alınır
4. **Platform**: Token kaydederken `platform: 'mobile'` gönderilir
5. **Background**: Background handler top-level function olmalı

## Sorun Giderme

- **Token alınamıyor**: Firebase yapılandırmasını kontrol edin
- **Bildirim gelmiyor**: Notification permission'ı kontrol edin
- **Yönlendirme çalışmıyor**: GoRouter yapılandırmasını kontrol edin
- **Background çalışmıyor**: Handler'ın top-level function olduğundan emin olun

